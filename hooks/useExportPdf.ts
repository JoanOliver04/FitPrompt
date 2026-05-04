'use client'

import { useState, useCallback } from 'react'

export type ExportStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseExportPdfReturn {
  status: ExportStatus
  error: string | null
  download: (chatId: string) => Promise<void>
  clearError: () => void
}

export function useExportPdf(): UseExportPdfReturn {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async (chatId: string) => {
    setStatus('loading')
    setError(null)

    try {
      const res = await fetch(`/api/chat/${chatId}/export-pdf`)

      if (!res.ok) {
        const data: Record<string, unknown> = await res.json().catch(() => ({}))
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : `Error al generar el PDF (${res.status})`,
        )
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `fitprompt-plan-${chatId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('success')
      // Auto-reset so the button returns to idle after the user sees the confirmation.
      setTimeout(() => setStatus('idle'), 2200)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'No se pudo descargar el PDF.')
    }
  }, [])

  const clearError = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return { status, error, download, clearError }
}

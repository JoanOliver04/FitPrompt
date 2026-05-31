'use client'

import { useState } from 'react'

interface Props {
  chatId:    string
  messageId: string
}

export default function DietPdfButton({ chatId, messageId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function download() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/chat/${chatId}/diet-pdf?messageId=${encodeURIComponent(messageId)}`,
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'No se pudo generar el PDF.')
        setLoading(false)
        return
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `fitprompt-dieta-${chatId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF471A] hover:text-[#e03d15] border border-[#FF471A33] hover:border-[#FF471A66] rounded-lg px-3 py-1.5 transition-all disabled:opacity-60"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {loading ? 'Generando…' : 'Descargar dieta en PDF'}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-1" role="alert">{error}</p>
      )}
    </>
  )
}

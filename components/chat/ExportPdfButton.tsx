'use client'

import { useExportPdf } from '@/hooks/useExportPdf'

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  chatId: string
  /** Compact: fits in the chat header. Full: standalone card button. */
  size?: 'compact' | 'full'
}

export function ExportPdfButton({ chatId, size = 'compact' }: Props) {
  const { status, error, download, clearError } = useExportPdf()

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError   = status === 'error'

  // ── Shared state styles ───────────────────────────────────────────────────────
  const stateClass = isSuccess
    ? 'border-green-700/50 bg-green-950/30 text-green-400'
    : isError
    ? 'border-red-700/50 bg-red-950/30 text-red-400'
    : 'border-border-default text-text-secondary hover:border-[#FF471A66] hover:text-[#FF471A] hover:bg-[#FF471A08]'

  // ── Label & icon ─────────────────────────────────────────────────────────────
  const icon = isLoading ? <SpinnerIcon />
             : isSuccess ? <CheckIcon />
             : isError   ? <ErrorIcon />
             :              <DownloadIcon />

  const label = isLoading ? 'Generando…'
              : isSuccess ? '¡Descargado!'
              : isError   ? 'Reintentar'
              :              'PDF'

  // ─── Compact (chat header) ────────────────────────────────────────────────────
  if (size === 'compact') {
    return (
      <div className="relative shrink-0">
        <button
          onClick={() => isError ? clearError() : download(chatId)}
          disabled={isLoading}
          aria-label={isLoading ? 'Generando PDF…' : 'Descargar plan en PDF'}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5
            border rounded-lg text-xs font-medium
            transition-all duration-200 active:scale-95
            disabled:opacity-50 disabled:pointer-events-none
            ${stateClass}
          `}
        >
          {icon}
          <span>{label}</span>
        </button>

        {/* Error tooltip — floats below the button, doesn't shift layout */}
        {isError && error && (
          <div
            role="alert"
            className="absolute top-full right-0 mt-1.5 z-20 w-64 bg-[#1a0000] border border-red-800/40 text-red-300 text-xs px-3 py-2.5 rounded-xl shadow-2xl"
          >
            <p className="leading-relaxed mb-1.5">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-300 text-[10px] font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Full (dashboard card) ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => isError ? clearError() : download(chatId)}
        disabled={isLoading}
        aria-label={isLoading ? 'Generando PDF…' : 'Descargar plan en PDF'}
        className={`
          flex items-center gap-2 px-4 py-2.5
          border rounded-xl text-sm font-semibold
          transition-all duration-200 active:scale-95
          disabled:opacity-50 disabled:pointer-events-none
          ${stateClass}
        `}
      >
        {icon}
        <span>
          {isLoading ? 'Generando PDF…'
          : isSuccess ? '¡PDF descargado!'
          : isError   ? 'Reintentar'
          :              'Descargar PDF'}
        </span>
      </button>

      {isError && error && (
        <div role="alert" className="flex items-start justify-between gap-2 w-full bg-red-950/30 border border-red-800/30 text-red-400 text-xs px-3 py-2 rounded-lg">
          <p className="leading-relaxed">{error}</p>
          <button onClick={clearError} aria-label="Cerrar error" className="text-red-600 hover:text-red-400 shrink-0 mt-0.5 transition-colors">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

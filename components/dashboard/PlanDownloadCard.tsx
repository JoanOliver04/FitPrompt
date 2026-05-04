'use client'

import { ExportPdfButton } from '@/components/chat/ExportPdfButton'

interface Props {
  chatId:    string
  chatTitle: string
}

export function PlanDownloadCard({ chatId, chatTitle }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 bg-bg-secondary border border-border-default rounded-2xl px-5 py-4 animate-enter">
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-[#FF471A12] border border-[#FF471A22] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF471A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-text-primary font-semibold text-sm">Tu plan activo</p>
          <p className="text-text-muted text-xs truncate mt-0.5">{chatTitle}</p>
        </div>
      </div>

      <ExportPdfButton chatId={chatId} size="full" />
    </div>
  )
}

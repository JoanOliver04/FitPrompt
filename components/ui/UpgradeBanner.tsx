'use client'

import Link from 'next/link'
import { useState } from 'react'

type LimitCode = 'DAILY_MESSAGE_LIMIT' | 'CHAT_LIMIT' | 'PREMIUM_REQUIRED'

interface UpgradeBannerProps {
  code?: LimitCode
  message?: string
  dismissible?: boolean
  className?: string
  /** Called when the user dismisses the banner — use to clear external error state. */
  onDismiss?: () => void
}

const COPY: Record<LimitCode, { title: string; subtitle: string; emoji: string }> = {
  DAILY_MESSAGE_LIMIT: {
    emoji: '⏳',
    title: 'Límite diario alcanzado',
    subtitle: 'Con Premium tienes mensajes ilimitados cada día.',
  },
  CHAT_LIMIT: {
    emoji: '💬',
    title: 'Límite de chats alcanzado',
    subtitle: 'Con Premium puedes crear chats ilimitados.',
  },
  PREMIUM_REQUIRED: {
    emoji: '⚡',
    title: 'Función exclusiva Premium',
    subtitle: 'Desbloquea esta y muchas más funciones avanzadas.',
  },
}

const DEFAULT_COPY = {
  emoji: '⚡',
  title: 'Límite del plan Free',
  subtitle: 'Hazte Premium para continuar sin restricciones.',
}

export default function UpgradeBanner({
  code,
  message,
  dismissible = false,
  className = '',
  onDismiss,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const copy = code ? COPY[code] : DEFAULT_COPY

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-[#FF471A]/25 bg-[#FF471A]/[0.04] p-4',
        className,
      ].join(' ')}
      role="alert"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF471A]/[0.06] to-transparent pointer-events-none" />

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-[#FF471A1A] border border-[#FF471A30] flex items-center justify-center shrink-0 text-base select-none">
          {copy.emoji}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-bold text-sm leading-tight">
            {copy.title}
          </p>
          <p className="text-text-muted text-xs mt-0.5 leading-snug">
            {message ?? copy.subtitle}
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/pricing"
          className="shrink-0 bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
        >
          Ver planes
        </Link>

        {/* Dismiss */}
        {dismissible && (
          <button
            type="button"
            onClick={() => { setDismissed(true); onDismiss?.() }}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-all"
            aria-label="Cerrar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

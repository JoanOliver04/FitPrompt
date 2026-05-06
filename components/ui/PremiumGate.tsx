'use client'

import Link from 'next/link'

interface Props {
  /** Human-readable name of the locked feature, e.g. "Gráficas avanzadas" */
  feature: string
  /** One-line description shown below the title */
  description?: string
  /**
   * Optional content shown blurred behind the lock overlay.
   * Gives the user a preview of what they're missing.
   */
  children?: React.ReactNode
}

/**
 * Renders a lock placeholder for premium-only sections.
 * Drop it in place of the real content for free-plan users.
 *
 * Usage:
 *   {isPremium ? <RealComponent /> : (
 *     <PremiumGate feature="Gráficas avanzadas" description="IMC, evolución mensual y más" />
 *   )}
 *
 * Or with a blurred preview:
 *   {isPremium ? <RealComponent /> : (
 *     <PremiumGate feature="Gráficas avanzadas">
 *       <RealComponent />
 *     </PremiumGate>
 *   )}
 */
export default function PremiumGate({ feature, description, children }: Props) {
  return (
    <div className="relative rounded-2xl border border-[#FF471A22] bg-bg-secondary overflow-hidden">
      {/* Blurred preview — only rendered if caller provides children */}
      {children && (
        <div
          className="pointer-events-none select-none blur-sm opacity-25 p-4"
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      {/* Lock UI */}
      <div
        className={[
          'flex flex-col items-center justify-center text-center gap-3 p-6',
          children ? 'absolute inset-0 bg-bg-secondary/60 backdrop-blur-[2px]' : '',
        ].join(' ')}
      >
        {/* Lock icon */}
        <div className="w-12 h-12 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF471A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {/* Text */}
        <div>
          <p className="text-text-primary font-bold text-sm">{feature}</p>
          <p className="text-text-muted text-xs mt-1 max-w-[22rem] leading-relaxed">
            {description ?? 'Disponible en el plan Premium'}
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 bg-[#FF471A] hover:bg-[#e03d15] active:scale-[0.97] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Ver Premium
        </Link>
      </div>
    </div>
  )
}

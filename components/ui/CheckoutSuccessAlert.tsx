'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function CheckoutSuccessAlert() {
  const params  = useSearchParams()
  const router  = useRouter()
  const { update } = useSession()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (params.get('checkout') !== 'success') return

    setVisible(true)

    router.replace('/dashboard', { scroll: false })

    // Re-read plan from DB into the JWT, then refresh Server Components so the
    // premium state is reflected immediately without a manual reload.
    const timer = setTimeout(async () => {
      await update()
      router.refresh()
    }, 200)

    return () => clearTimeout(timer)
  }, [params, router, update])

  if (!visible) return null

  return (
    <div className="mb-6 relative overflow-hidden bg-bg-secondary border border-[#FF471A]/30 rounded-2xl p-5 animate-enter">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF471A]/[0.06] to-transparent pointer-events-none" />
      <div className="relative flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 text-xl select-none">
          🎉
        </div>
        <div className="flex-1">
          <p className="text-text-primary font-bold text-sm">¡Bienvenido a Premium!</p>
          <p className="text-text-muted text-xs mt-0.5">
            Tu suscripción está activa. Disfruta de todas las funciones sin límites.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

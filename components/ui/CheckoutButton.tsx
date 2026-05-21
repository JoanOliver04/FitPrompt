'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CheckoutButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Triggers a redirect to Stripe Checkout. Card data is collected on Stripe's
 * hosted page — it never touches our infrastructure (PCI-DSS scope is reduced
 * to "we never see card numbers").
 */
export default function CheckoutButton({ className, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/create-checkout', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'No se pudo iniciar el pago.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-[0.97] disabled:opacity-60',
          className,
        )}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Redirigiendo…
          </>
        ) : (children ?? 'Hazte Premium')}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center" role="alert">{error}</p>
      )}
    </>
  )
}

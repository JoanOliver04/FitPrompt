'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CheckoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function CheckoutButton({ className, children }: CheckoutButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(v: string) {
    return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')
  }

  async function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Simulated payment processing delay
    await new Promise(r => setTimeout(r, 1800))

    try {
      const res = await fetch('/api/payment/upgrade', { method: 'POST' })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Error al procesar el pago.')
        setLoading(false)
        return
      }

      window.location.href = '/dashboard?checkout=success'
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null) }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all active:scale-[0.97]',
          className,
        )}
      >
        {children ?? 'Hazte Premium'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
              <div>
                <p className="text-white font-bold text-sm">FitPrompt Premium</p>
                <p className="text-[#FF471A] font-black text-lg">€9.99 / mes</p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                disabled={loading}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-40 p-1"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePay} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Nombre en la tarjeta</label>
                <input
                  type="text"
                  placeholder="Juan García"
                  value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                  required
                  disabled={loading}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF471A]/50 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Número de tarjeta</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                  required
                  disabled={loading}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF471A]/50 font-mono tracking-wider transition-colors disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Caducidad</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={card.expiry}
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    required
                    disabled={loading}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF471A]/50 font-mono transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">CVV</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvv}
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    required
                    disabled={loading}
                    className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF471A]/50 font-mono transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF471A] hover:bg-[#e03d15] disabled:opacity-60 disabled:pointer-events-none text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Procesando…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Pagar €9.99
                  </>
                )}
              </button>

              <p className="text-gray-600 text-[11px] text-center">
                Pago seguro · Sin permanencia · Cancela cuando quieras
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

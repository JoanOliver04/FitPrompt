'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  email: string
}

export default function MockCheckoutForm({ email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Pure-cosmetic fields — never sent anywhere. They exist only to make the
  // page feel like a real card-collection screen during demos.
  const [cardName, setCardName] = useState('')
  const [cardNum,  setCardNum]  = useState('4242 4242 4242 4242')
  const [exp,      setExp]      = useState('12 / 30')
  const [cvc,      setCvc]      = useState('123')

  async function pay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/mock-confirm', { method: 'POST' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'No se pudo completar el pago de prueba.')
        setLoading(false)
        return
      }
      router.push('/dashboard?checkout=success')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Test-mode banner */}
        <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <span className="text-base">⚠️</span>
          PASARELA DE PRUEBA — no se procesa ningún pago real
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-2xl p-7">
          <div className="mb-6">
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Suscripción</p>
            <h1 className="text-2xl font-black">FitPrompt Premium</h1>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-black">€9.99</span>
              <span className="text-text-muted text-sm">/ mes</span>
            </div>
            <p className="text-text-muted text-xs mt-2">
              Sin permanencia · Cancela cuando quieras
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); pay() }}
            className="space-y-4"
            noValidate
          >
            <Field label="Email">
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-muted"
              />
            </Field>

            <Field label="Nombre del titular">
              <input
                type="text"
                placeholder="Como aparece en la tarjeta"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Número de tarjeta">
              <input
                type="text"
                inputMode="numeric"
                value={cardNum}
                onChange={(e) => setCardNum(e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Caducidad">
                <input
                  type="text"
                  placeholder="MM / AA"
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="CVC">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#FF471A] hover:bg-[#e03d15] active:scale-[0.97] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Procesando…
                </>
              ) : 'Pagar €9.99 / mes'}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center" role="alert">{error}</p>
            )}
          </form>

          <div className="mt-6 pt-5 border-t border-border-default flex items-center justify-between text-xs">
            <span className="text-text-muted">🔒 Conexión simulada</span>
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-bg-tertiary border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#FF471A] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-text-muted text-xs font-medium mb-1.5">{label}</label>
      {children}
    </div>
  )
}

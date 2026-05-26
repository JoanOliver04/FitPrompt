'use client'

import { useState } from 'react'
import Link from 'next/link'

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
)

export default function ForgotPasswordForm() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Introduce tu email'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })
      if (res.status === 429) {
        const data = await res.json()
        setError(data.error ?? 'Demasiados intentos. Espera unos minutos.')
        return
      }
      setSent(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 text-center animate-slide-up">
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-text-primary mb-2">Revisa tu email</h1>
        <p className="text-text-secondary text-sm mb-1 leading-relaxed">
          Si existe una cuenta asociada a <span className="text-text-primary font-medium">{email}</span>,
          recibirás un enlace para restablecer tu contraseña.
        </p>
        <p className="text-text-muted text-xs mb-8">El enlace caduca en 1 hora.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary border border-border-default hover:border-text-subtle rounded-xl px-5 py-2.5 transition-all font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 animate-slide-up">
      <h1 className="text-2xl font-black text-text-primary mb-1">Recuperar contraseña</h1>
      <p className="text-text-secondary text-sm mb-8">
        Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Enviando...</> : 'Enviar enlace'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        <Link href="/login" className="text-[#FF471A] hover:underline font-semibold">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}

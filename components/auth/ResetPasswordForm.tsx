'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
)

function ResetPasswordInner() {
  const searchParams           = useSearchParams()
  const router                 = useRouter()
  const token                  = searchParams.get('token') ?? ''
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password)                   { setError('Introduce la nueva contraseña'); return }
    if (password.length < 8)         { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm)        { setError('Las contraseñas no coinciden'); return }
    if (!token)                      { setError('Enlace inválido. Solicita uno nuevo.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al restablecer la contraseña')
        return
      }
      router.push('/login?reset=success')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 text-center animate-slide-up">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-black text-text-primary mb-2">Enlace inválido</h1>
        <p className="text-text-secondary text-sm mb-6">Este enlace no es válido o ha expirado.</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 bg-[#FF471A] hover:bg-[#e03d15] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 animate-slide-up">
      <h1 className="text-2xl font-black text-text-primary mb-1">Nueva contraseña</h1>
      <p className="text-text-secondary text-sm mb-8">Elige una contraseña segura para tu cuenta.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Guardando...</> : 'Guardar nueva contraseña'}
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

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  )
}

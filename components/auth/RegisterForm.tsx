'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

function validate(username: string, email: string, password: string, confirm: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return 'Nombre de usuario inválido: 3-20 caracteres, solo minúsculas, números y _'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Introduce un email válido'
  if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres'
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir mayúsculas, minúsculas y al menos un número'
  }
  if (password !== confirm) return 'Las contraseñas no coinciden'
  return null
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
)

export default function RegisterForm() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const passwordMismatch = confirm.length > 0 && confirm !== password

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/onboarding' })
    setGoogleLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validate(username, email, password, confirm)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        email:    email.toLowerCase().trim(),
        password,
      }),
    })

    const data = (await res.json()) as {
      error?: string
      issues?: { path: (string | number)[]; message: string }[]
    }

    if (!res.ok) {
      const firstIssue = data.issues?.[0]
      const issueMsg = firstIssue
        ? `${String(firstIssue.path[0] ?? 'campo')}: ${firstIssue.message}`
        : null
      setError(issueMsg ?? data.error ?? 'Error al crear la cuenta')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      router.push('/onboarding')
    } else {
      router.push('/login')
    }
  }

  const busy = loading || googleLoading

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 animate-slide-up">
      <h1 className="text-2xl font-black text-text-primary mb-1">Crea tu cuenta gratis</h1>
      <p className="text-text-secondary text-sm mb-8">Tu entrenador IA personal te está esperando</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 bg-bg-tertiary hover:bg-border-default border border-border-default hover:border-text-subtle text-text-primary py-3 rounded-xl mb-6 transition-all font-medium text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? <Spinner /> : <GoogleIcon />}
        Registrarse con Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-bg-secondary px-3 text-text-muted text-xs">o con email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="username" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Nombre de usuario
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="ivan_07"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
          {username.length > 0 && !USERNAME_RE.test(username) && (
            <p className="text-amber-400 text-xs mt-1">3-20 caracteres, solo minúsculas, números y _</p>
          )}
        </div>

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

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 12 caracteres, mayús, minús y número"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
          {password.length > 0 && password.length < 12 && (
            <p className="text-amber-400 text-xs mt-1">Mínimo 12 caracteres ({12 - password.length} restantes)</p>
          )}
          {password.length >= 12 && (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) && (
            <p className="text-amber-400 text-xs mt-1">Debe incluir mayúsculas, minúsculas y al menos un número</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite tu contraseña"
            className={`w-full bg-bg-tertiary border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
              passwordMismatch
                ? 'border-red-500/50 focus:border-red-500'
                : 'border-border-default focus:border-[#FF471A]'
            }`}
          />
          {passwordMismatch && (
            <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Al registrarte aceptas nuestros{' '}
          <Link href="/terms" className="text-[#FF471A] hover:underline">Términos de uso</Link>
          {' '}y{' '}
          <Link href="/privacy" className="text-[#FF471A] hover:underline">Política de privacidad</Link>.
        </p>

        <button
          type="submit"
          disabled={busy || passwordMismatch}
          className="w-full bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Creando cuenta...</> : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#FF471A] hover:underline font-semibold">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}

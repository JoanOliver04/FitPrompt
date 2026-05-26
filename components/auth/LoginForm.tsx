'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const REMEMBER_KEY = 'fitprompt_remember_email'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: 'Este email ya tiene cuenta con contraseña. Usa el formulario de abajo.',
  CredentialsSignin: 'Email o contraseña incorrectos.',
  Default: 'Error al iniciar sesión. Inténtalo de nuevo.',
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

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [rememberMe, setRememberMe]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    const e = searchParams.get('error')
    return e ? (AUTH_ERROR_MESSAGES[e] ?? AUTH_ERROR_MESSAGES.Default) : null
  })
  const resetSuccess = searchParams.get('reset') === 'success'

  // Pre-fill email if previously remembered
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/dashboard' })
    setGoogleLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) { setError('Introduce tu email'); return }
    if (!password)     { setError('Introduce tu contraseña'); return }

    setLoading(true)
    setError(null)

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email.toLowerCase().trim())
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      router.push('/dashboard')
    } else {
      setError('Email o contraseña incorrectos.')
    }
  }

  const busy = loading || googleLoading

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 animate-slide-up">
      <h1 className="text-2xl font-black text-text-primary mb-1">Bienvenido de nuevo</h1>
      <p className="text-text-secondary text-sm mb-8">Continúa tu entrenamiento donde lo dejaste</p>

      {resetSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-6">
          Contraseña restablecida. Ya puedes iniciar sesión.
        </div>
      )}

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
        Continuar con Google
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
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Contraseña
            </label>
            <Link href="/forgot-password" className="text-xs text-[#FF471A] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            onClick={() => setRememberMe(v => !v)}
            className={[
              'w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0',
              rememberMe
                ? 'bg-[#FF471A] border-[#FF471A]'
                : 'bg-bg-tertiary border-border-default group-hover:border-text-subtle',
            ].join(' ')}
          >
            {rememberMe && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            Recuérdame
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner /> Iniciando...</> : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-[#FF471A] hover:underline font-semibold">
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  )
}

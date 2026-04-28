import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Crear cuenta',
}

export default function RegisterPage() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 animate-slide-up">
      <h1 className="text-2xl font-black text-white mb-1">Crea tu cuenta gratis</h1>
      <p className="text-[#E0E0E0] text-sm mb-8">Tu entrenador IA personal te está esperando</p>

      {/* Google OAuth */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-[#242424] hover:bg-[#2e2e2e] border border-[#2a2a2a] hover:border-[#3a3a3a] text-white py-3 rounded-xl mb-6 transition-all font-medium text-sm active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Registrarse con Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2a2a2a]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#1a1a1a] px-3 text-[#666] text-xs">o con email</span>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Tu nombre"
            className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Mínimo 8 caracteres"
            className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Repite tu contraseña"
            className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>

        <p className="text-xs text-[#666] leading-relaxed">
          Al registrarte aceptas nuestros{' '}
          <Link href="/terms" className="text-[#FF471A] hover:underline">Términos de uso</Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-[#FF471A] hover:underline">Política de privacidad</Link>.
        </p>

        <button
          type="submit"
          className="w-full bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold transition-all"
        >
          Crear cuenta gratis
        </button>
      </form>

      <p className="text-center text-sm text-[#E0E0E0] mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#FF471A] hover:underline font-semibold">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FitPrompt — Tu entrenador IA personal',
}

const features = [
  {
    icon: '🏋️',
    title: 'Rutinas personalizadas',
    description:
      'Planes de entrenamiento adaptados a tu nivel, objetivo y tiempo disponible. Gimnasio, casa o sin material.',
  },
  {
    icon: '🥗',
    title: 'Dieta inteligente',
    description:
      'Planes de alimentación según tus preferencias, alergias y metas nutricionales con macros detallados.',
  },
  {
    icon: '📈',
    title: 'Seguimiento real',
    description:
      'Registra tu progreso, visualiza tus rachas y ajusta el plan en tiempo real con tu entrenador IA.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '0€',
    period: 'para siempre',
    features: [
      '5 mensajes/día con la IA',
      'Hasta 3 chats guardados',
      'Generación de rutina + dieta',
      'Exportar plan en PDF',
      'Tracking de peso y entrenamientos',
      '4 badges desbloqueables',
    ],
    cta: 'Empieza gratis',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Fit Premium',
    price: '9,99€',
    period: 'al mes',
    features: [
      'Mensajes ilimitados con Claude IA',
      'Chats ilimitados guardados',
      'Gráficas avanzadas de progreso',
      'Grupos y rankings con amigos',
      'Todos los badges desbloqueados',
      'Check-in semanal automático',
    ],
    cta: 'Prueba 7 días gratis',
    href: '/register?plan=premium',
    highlighted: true,
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#101010] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#101010]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#FF471A] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold text-lg">FitPrompt</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[#E0E0E0] hover:text-white transition-colors text-sm px-3 py-1.5"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Empieza gratis
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-[#FF471A1A] border border-[#FF471A33] text-[#FF471A] px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span>✨</span>
          <span>Powered by IA — Groq & Claude</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none tracking-tight text-balance">
          Tu entrenador personal
          <span className="block text-[#FF471A]">con IA real</span>
        </h1>
        <p className="text-[#E0E0E0] text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Rutinas y dietas 100% personalizadas según tu cuerpo, objetivos y disponibilidad.
          Habla con tu entrenador IA cuando quieras.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/register"
            className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white px-8 py-4 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg shadow-[#FF471A33]"
          >
            Empieza gratis — es gratis →
          </Link>
          <Link
            href="/login"
            className="border border-[#2a2a2a] hover:border-[#FF471A] text-[#E0E0E0] hover:text-white px-8 py-4 rounded-xl text-base font-semibold transition-all"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="text-[#666] text-xs mt-4">Sin tarjeta de crédito • Gratis para siempre</p>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-12">
            Todo lo que necesitas para transformarte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#FF471A44] rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-[#E0E0E0] text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 border-t border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-4">Planes simples</h2>
          <p className="text-[#E0E0E0] text-center mb-12">Sin sorpresas. Sin contratos.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border transition-all ${
                  plan.highlighted
                    ? 'bg-[#FF471A0D] border-[#FF471A] shadow-lg shadow-[#FF471A1A]'
                    : 'bg-[#1a1a1a] border-[#2a2a2a]'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block bg-[#FF471A] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    RECOMENDADO
                  </div>
                )}
                <h3 className="text-white font-black text-2xl mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-[#E0E0E0] text-sm mb-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-[#E0E0E0]">
                      <span className="text-[#FF471A] shrink-0">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-xl font-bold transition-all active:scale-95 ${
                    plan.highlighted
                      ? 'bg-[#FF471A] hover:bg-[#e03d15] text-white'
                      : 'border border-[#2a2a2a] hover:border-[#FF471A] text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#666]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#FF471A] rounded flex items-center justify-center">
              <span className="text-white font-black text-[10px]">F</span>
            </div>
            <span>© 2025 FitPrompt</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacidad
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

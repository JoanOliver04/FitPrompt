import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import CheckoutButton from '@/components/ui/CheckoutButton'
import type { Plan } from '@/types'

export const metadata: Metadata = {
  title: 'Planes — FitPrompt',
  description: 'Desbloquea todo el potencial de FitCoach IA con el plan Premium.',
}

// ─── Feature data ─────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { text: 'Acceso a FitCoach IA', highlight: false },
  { text: '5 mensajes por día', highlight: false },
  { text: '3 chats guardados', highlight: false },
  { text: 'Rutinas personalizadas', highlight: false },
  { text: 'Lista de la compra', highlight: false },
  { text: '4 badges de inicio', highlight: false },
]

const PREMIUM_FEATURES = [
  { text: 'Todo lo del plan Free', highlight: false },
  { text: 'Mensajes ilimitados', highlight: true },
  { text: 'Chats ilimitados', highlight: true },
  { text: 'Gráficas de progreso', highlight: true },
  { text: 'Grupos sociales', highlight: true },
  { text: 'Retos semanales', highlight: true },
  { text: 'Todos los badges (12)', highlight: true },
  { text: 'Check-ins con IA', highlight: false },
]

const COMPARISON: Array<{
  feature: string
  free: string | boolean
  premium: string | boolean
}> = [
  { feature: 'Mensajes / día',         free: '5',           premium: 'Ilimitados' },
  { feature: 'Chats guardados',         free: '3',           premium: 'Ilimitados' },
  { feature: 'FitCoach IA',             free: true,          premium: true },
  { feature: 'Rutinas personalizadas',  free: true,          premium: true },
  { feature: 'Lista de la compra',      free: true,          premium: true },
  { feature: 'Check-ins con IA',        free: true,          premium: true },
  { feature: 'Gráficas de progreso',    free: false,         premium: true },
  { feature: 'Grupos sociales',         free: false,         premium: true },
  { feature: 'Retos semanales',         free: false,         premium: true },
  { feature: 'Todos los badges',        free: '4 básicos',   premium: 'Todos (12)' },
]

// ─── Icon components ──────────────────────────────────────────────────────────

function CheckIcon({ accent = false }: { accent?: boolean }) {
  return (
    <div className="flex justify-center">
      <svg
        className={accent ? 'w-5 h-5 text-[#FF471A]' : 'w-5 h-5 text-[#FF471A]'}
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function XIcon() {
  return (
    <div className="flex justify-center">
      <svg
        className="w-5 h-5 text-text-muted opacity-25"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  )
}

function CellValue({ value, isPremium = false }: { value: string | boolean; isPremium?: boolean }) {
  if (typeof value === 'string') {
    return (
      <span className={`text-sm font-semibold ${isPremium ? 'text-[#FF471A]' : 'text-text-secondary'}`}>
        {value}
      </span>
    )
  }
  return value ? <CheckIcon /> : <XIcon />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  const plan = (session?.user as { plan?: Plan } | undefined)?.plan ?? null
  const isLoggedIn = !!session?.user?.id
  const isPremium = plan === 'premium'
  const isFree = plan === 'free'

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-[var(--bg-glass)] backdrop-blur-md border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium">{isLoggedIn ? 'Dashboard' : 'Inicio'}</span>
          </Link>

          <div className="flex-1" />

          {isPremium && (
            <span className="flex items-center gap-1.5 text-[#FF471A] text-xs font-semibold bg-[#FF471A1A] border border-[#FF471A33] px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Premium activo
            </span>
          )}
          {isFree && (
            <span className="text-text-muted text-xs bg-bg-tertiary border border-border-default px-3 py-1.5 rounded-full font-medium">
              Plan Free
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 pb-24">

        {/* ── Hero ── */}
        <div className="text-center mb-14 animate-enter">
          <div className="inline-flex items-center gap-2 bg-[#FF471A1A] border border-[#FF471A33] rounded-full px-4 py-1.5 text-[#FF471A] text-sm font-semibold mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Planes FitPrompt
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
            Desbloquea todo el{' '}
            <span className="text-[#FF471A]">potencial</span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Tu entrenador personal y nutricionista de élite. Escoge el plan que se adapta a tu ritmo.
          </p>
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">

          {/* Free */}
          <div className="bg-bg-secondary border border-border-default rounded-2xl p-7 flex flex-col animate-enter stagger-1">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Para empezar</p>
                <h2 className="text-2xl font-black text-text-primary">Free</h2>
              </div>
              {isFree && (
                <span className="mt-1 bg-bg-tertiary text-text-muted text-[11px] font-bold px-3 py-1 rounded-full border border-border-default uppercase tracking-wide">
                  Tu plan
                </span>
              )}
            </div>

            <div className="mb-6">
              <span className="text-5xl font-black text-text-primary">€0</span>
              <span className="text-text-muted text-sm ml-1.5 font-medium">/ mes</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(({ text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-text-secondary">
                  <CheckIcon />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href={isLoggedIn ? '/dashboard' : '/register'}
              className={[
                'block w-full text-center font-semibold rounded-xl py-3 text-sm transition-all active:scale-[0.97]',
                isFree
                  ? 'bg-bg-tertiary text-text-muted pointer-events-none'
                  : 'bg-bg-tertiary hover:bg-border-default border border-border-default text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              {isFree ? 'Plan actual' : isLoggedIn ? 'Ir al dashboard' : 'Empezar gratis'}
            </Link>
          </div>

          {/* Premium */}
          <div className="relative bg-bg-secondary border border-[#FF471A]/35 rounded-2xl p-7 flex flex-col animate-enter stagger-2 shadow-[0_0_50px_rgba(255,71,26,0.07)]">
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="bg-[#FF471A] text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-[#FF471A]/30 tracking-wide">
                ⚡ RECOMENDADO
              </span>
            </div>

            <div className="flex items-start justify-between mb-5 pt-2">
              <div>
                <p className="text-[#FF471A] text-xs font-semibold uppercase tracking-wider mb-1">Sin límites</p>
                <h2 className="text-2xl font-black text-text-primary">Premium</h2>
              </div>
              {isPremium && (
                <span className="mt-1 bg-[#FF471A1A] text-[#FF471A] text-[11px] font-bold px-3 py-1 rounded-full border border-[#FF471A33] uppercase tracking-wide">
                  Tu plan
                </span>
              )}
            </div>

            <div className="mb-6">
              <span className="text-5xl font-black text-text-primary">€9.99</span>
              <span className="text-text-muted text-sm ml-1.5 font-medium">/ mes</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PREMIUM_FEATURES.map(({ text, highlight }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <CheckIcon />
                  <span className={highlight ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="block w-full text-center font-bold rounded-xl py-3.5 text-sm bg-[#FF471A1A] text-[#FF471A] border border-[#FF471A33]">
                ✓ Plan activo
              </div>
            ) : isLoggedIn ? (
              <CheckoutButton className="w-full bg-[#FF471A] hover:bg-[#e03d15] text-white text-sm py-3.5 rounded-xl shadow-lg shadow-[#FF471A]/20">
                Hazte Premium
              </CheckoutButton>
            ) : (
              <Link
                href="/register"
                className="block w-full text-center font-bold rounded-xl py-3.5 text-sm bg-[#FF471A] hover:bg-[#e03d15] text-white shadow-lg shadow-[#FF471A]/20 transition-all active:scale-[0.97]"
              >
                Empezar gratis
              </Link>
            )}
          </div>
        </div>

        {/* ── Comparison table ── */}
        <div className="mb-16 animate-enter stagger-3">
          <h2 className="text-2xl font-black text-center mb-3">Comparativa completa</h2>
          <p className="text-text-muted text-sm text-center mb-8">Todo lo que incluye cada plan</p>

          <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-bg-tertiary/50">
                  <th className="text-left px-5 sm:px-7 py-4 text-text-muted text-xs font-bold uppercase tracking-wider w-1/2">
                    Funcionalidad
                  </th>
                  <th className="text-center px-4 py-4 text-text-secondary text-xs font-bold uppercase tracking-wider w-1/4">
                    Free
                  </th>
                  <th className="text-center px-4 py-4 text-[#FF471A] text-xs font-bold uppercase tracking-wider w-1/4">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border-default last:border-0 transition-colors ${i % 2 !== 0 ? 'bg-bg-tertiary/20' : ''}`}
                  >
                    <td className="px-5 sm:px-7 py-4 text-sm text-text-secondary font-medium">
                      {row.feature}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CellValue value={row.free} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <CellValue value={row.premium} isPremium />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom CTA (free users only) ── */}
        {!isPremium && (
          <div className="animate-enter stagger-4">
            <div className="relative overflow-hidden bg-bg-secondary border border-[#FF471A]/25 rounded-3xl p-8 sm:p-12 text-center">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FF471A]/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FF471A]/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="text-5xl mb-5">🚀</div>
                <h3 className="text-3xl font-black mb-3">
                  ¿Listo para transformarte?
                </h3>
                <p className="text-text-secondary text-base mb-8 max-w-sm mx-auto leading-relaxed">
                  Únete a los atletas que ya entrenan con IA sin límites. Sin permanencia, cancela cuando quieras.
                </p>

                {isLoggedIn ? (
                  <CheckoutButton className="bg-[#FF471A] hover:bg-[#e03d15] text-white font-bold text-base px-10 py-4 rounded-2xl shadow-xl shadow-[#FF471A]/25">
                    Hazte Premium ahora
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </CheckoutButton>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2.5 bg-[#FF471A] hover:bg-[#e03d15] text-white font-bold text-base px-10 py-4 rounded-2xl transition-all active:scale-[0.97] shadow-xl shadow-[#FF471A]/25"
                  >
                    Crear cuenta gratis
                  </Link>
                )}

                <p className="text-text-muted text-xs mt-5 font-medium">
                  Sin permanencia · Cancela cuando quieras · Soporte 24/7
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

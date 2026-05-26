import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import CheckoutButton from '@/components/ui/CheckoutButton'
import { PrivacyToggle } from '@/components/settings/PrivacyToggle'
import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'
import { NotificationPrefs } from '@/components/settings/NotificationPrefs'
import type { Plan } from '@/types'

export const metadata: Metadata = {
  title: 'Configuración — FitPrompt',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const plan = (session.user as { plan?: Plan }).plan ?? 'free'
  const isPremium = plan === 'premium'

  const userRow = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { isPublic: true, password: true, notificationPrefs: true },
  })
  const isPublic    = userRow?.isPublic ?? true
  const hasPassword = !!userRow?.password
  const notifPrefs  = {
    new_follower:   true,
    group_invite:   true,
    rank_surpassed: true,
    ...(typeof userRow?.notificationPrefs === 'object' && userRow.notificationPrefs !== null
      ? userRow.notificationPrefs as Record<string, boolean>
      : {}),
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-enter">
      <h1 className="text-3xl font-black text-text-primary mb-8">Configuración</h1>

      {/* ── Plan & Billing ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
          Plan y facturación
        </h2>

        <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">

          {/* Current plan row */}
          <div className="p-5 border-b border-border-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-semibold text-sm">Plan actual</p>
                <p className="text-text-muted text-xs mt-0.5">
                  {isPremium
                    ? 'Tienes acceso ilimitado a todas las funciones'
                    : '5 mensajes/día · 3 chats · Funciones básicas'}
                </p>
              </div>
              <span
                className={[
                  'text-xs font-bold px-3 py-1.5 rounded-full border',
                  isPremium
                    ? 'bg-[#FF471A1A] text-[#FF471A] border-[#FF471A33]'
                    : 'bg-bg-tertiary text-text-muted border-border-default',
                ].join(' ')}
              >
                {isPremium ? '⚡ Premium' : 'Free'}
              </span>
            </div>
          </div>

          {/* Upgrade / Manage */}
          {isPremium ? (
            <div className="p-5">
              <p className="text-text-secondary text-sm font-medium mb-1">Gestión de suscripción</p>
              <p className="text-text-muted text-xs mb-4">
                Para cancelar o modificar tu suscripción, contacta con soporte.
              </p>
              <Link
                href="mailto:support@fitprompt.app"
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary border border-border-default hover:border-text-subtle rounded-xl px-4 py-2.5 transition-all font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Contactar soporte
              </Link>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 text-lg select-none">
                  ⚡
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-sm">FitPrompt Premium</p>
                  <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
                    Mensajes ilimitados · Chats ilimitados · Gráficas · Grupos sociales · Todos los badges
                  </p>
                  <p className="text-[#FF471A] font-bold text-sm mt-1.5">€9.99 / mes</p>
                </div>
              </div>

              <CheckoutButton
                className="w-full bg-[#FF471A] hover:bg-[#e03d15] text-white text-sm py-3 px-6 rounded-xl shadow-lg shadow-[#FF471A]/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Suscribirme ahora
              </CheckoutButton>

              <p className="text-text-muted text-[11px] text-center mt-3 leading-snug">
                Pago seguro · Sin permanencia · Cancela cuando quieras
              </p>
            </div>
          )}
        </div>

        {!isPremium && (
          <p className="text-text-muted text-xs mt-2 px-1">
            ¿Quieres ver qué incluye cada plan?{' '}
            <Link href="/pricing" className="text-[#FF471A] hover:underline font-medium">
              Ver comparativa
            </Link>
          </p>
        )}
      </section>

      {/* ── Account ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
          Cuenta
        </h2>
        <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border-default">
            <p className="text-text-primary font-semibold text-sm mb-0.5">Correo electrónico</p>
            <p className="text-text-muted text-sm">{session.user.email ?? '—'}</p>
          </div>
          <div className="p-5">
            <p className="text-text-primary font-semibold text-sm mb-0.5">Nombre</p>
            <p className="text-text-muted text-sm">{session.user.name ?? '—'}</p>
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      {hasPassword && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
            Seguridad
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-1">
              <p className="text-text-primary font-semibold text-sm mb-0.5">Cambiar contraseña</p>
              <p className="text-text-muted text-xs">Al cambiar la contraseña, todas las sesiones activas serán cerradas.</p>
            </div>
            <ChangePasswordForm />
          </div>
        </section>
      )}

      {/* ── Privacy ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
          Privacidad
        </h2>
        <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
          <PrivacyToggle initialIsPublic={isPublic} />
        </div>
      </section>

      {/* ── Notifications ── */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
          Notificaciones
        </h2>
        <NotificationPrefs initialPrefs={{
          new_follower:   notifPrefs.new_follower   !== false,
          group_invite:   notifPrefs.group_invite   !== false,
          rank_surpassed: notifPrefs.rank_surpassed !== false,
        }} />
      </section>

      {/* ── Danger zone ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 px-1">
          Zona de peligro
        </h2>
        <div className="bg-bg-secondary border border-red-900/25 rounded-2xl p-5">
          <p className="text-text-primary font-semibold text-sm mb-1">Eliminar cuenta</p>
          <p className="text-text-muted text-xs mb-4 leading-relaxed">
            Se eliminarán todos tus datos permanentemente. Esta acción no se puede deshacer.
          </p>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  )
}

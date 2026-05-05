import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BadgesGrid } from '@/components/profile/BadgesGrid'

export const metadata: Metadata = {
  title: 'Perfil',
}

const profileSections = [
  {
    title: 'Datos personales',
    items: [
      { label: 'Nombre', value: 'Atleta FitPrompt' },
      { label: 'Email', value: 'atleta@email.com' },
      { label: 'Edad', value: '25 años' },
    ],
  },
  {
    title: 'Datos físicos',
    items: [
      { label: 'Peso', value: '75 kg' },
      { label: 'Altura', value: '178 cm' },
      { label: 'Objetivo', value: 'Volumen' },
    ],
  },
  {
    title: 'Preferencias de entrenamiento',
    items: [
      { label: 'Nivel', value: 'Intermedio' },
      { label: 'Días/semana', value: '4 días' },
      { label: 'Tipo', value: 'Gimnasio' },
    ],
  },
]

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  const [followersCount, followingCount] = session?.user?.id
    ? await Promise.all([
        db.follow.count({ where: { followingId: session.user.id } }),
        db.follow.count({ where: { followerId:  session.user.id } }),
      ])
    : [0, 0]

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full animate-fade-in">
      <h1 className="text-3xl font-black text-text-primary mb-8">Mi perfil</h1>

      {/* Avatar + stats */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0">
          <span className="text-4xl">👤</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-black text-text-primary">Atleta FitPrompt</h2>
          <p className="text-text-secondary text-sm mb-3">atleta@email.com</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-[#FF471A] font-black text-lg">🔥 5</div>
              <div className="text-text-muted text-xs">Racha</div>
            </div>
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-text-primary font-black text-lg">⭐ 3</div>
              <div className="text-text-muted text-xs">Nivel</div>
            </div>
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-text-primary font-black text-lg">700 XP</div>
              <div className="text-text-muted text-xs">Experiencia</div>
            </div>
            <Link href="/social" className="bg-bg-tertiary hover:bg-bg-secondary rounded-xl px-4 py-2 text-center transition-colors">
              <div className="text-text-primary font-black text-lg tabular-nums">{followersCount}</div>
              <div className="text-text-muted text-xs">Seguidores</div>
            </Link>
            <Link href="/social" className="bg-bg-tertiary hover:bg-bg-secondary rounded-xl px-4 py-2 text-center transition-colors">
              <div className="text-text-primary font-black text-lg tabular-nums">{followingCount}</div>
              <div className="text-text-muted text-xs">Siguiendo</div>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="bg-bg-tertiary border border-border-default text-text-secondary text-xs font-semibold px-3 py-1 rounded-full text-center">
            Plan Free
          </span>
          <Link
            href="/pricing"
            className="bg-[#FF471A] hover:bg-[#e03d15] text-white text-xs font-bold px-4 py-1.5 rounded-full text-center transition-colors"
          >
            Ir a Premium
          </Link>
        </div>
      </div>

      {/* Profile sections */}
      <div className="space-y-4 mb-6">
        {profileSections.map((section) => (
          <div key={section.title} className="bg-bg-secondary border border-border-default rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-text-primary font-bold">{section.title}</h3>
              <button type="button" className="text-[#FF471A] text-xs font-semibold hover:underline">
                Editar
              </button>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                  <span className="text-text-muted text-sm">{item.label}</span>
                  <span className="text-text-primary text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 mb-6">
        <h3 className="text-text-primary font-bold mb-4">Logros</h3>
        {session?.user?.id
          ? <BadgesGrid userId={session.user.id} />
          : <p className="text-text-muted text-sm">Inicia sesión para ver tus logros.</p>
        }
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href="/settings"
          className="flex items-center justify-between bg-bg-secondary border border-border-default hover:border-text-subtle rounded-xl px-5 py-4 text-text-secondary hover:text-text-primary transition-all"
        >
          <span className="text-sm font-medium">⚙️ Configuración</span>
          <span className="text-text-muted">›</span>
        </Link>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-bg-secondary border border-border-default hover:border-text-subtle rounded-xl px-5 py-4 text-text-secondary hover:text-text-primary transition-all"
        >
          <span className="text-sm font-medium">🚪 Cerrar sesión</span>
          <span className="text-text-muted">›</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-bg-secondary border border-red-900/30 hover:border-red-800/60 rounded-xl px-5 py-4 text-red-400 hover:text-red-300 transition-all"
        >
          <span className="text-sm font-medium">🗑️ Eliminar cuenta</span>
          <span className="opacity-50">›</span>
        </button>
      </div>
    </div>
  )
}

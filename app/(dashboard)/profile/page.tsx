import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BadgesGrid } from '@/components/profile/BadgesGrid'
import { ProfileActions } from '@/components/profile/ProfileActions'
import ProfileSections from '@/components/profile/ProfileSections'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { calculateAge } from '@/lib/age'
import { formatLastLogin } from '@/lib/utils'
import { deriveLevel } from '@/lib/xp'

export const metadata: Metadata = {
  title: 'Perfil',
}

const GOAL_LABEL: Record<string, string> = {
  volume:      'Volumen',
  definition:  'Definición',
  maintenance: 'Mantenimiento',
  weight_loss: 'Pérdida de peso',
}

const LEVEL_LABEL: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

const WORKOUT_LABEL: Record<string, string> = {
  gym:        'Gimnasio',
  home:       'Casa',
  bodyweight: 'Peso corporal',
}

function formatBirthDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  const [followersCount, followingCount, profile, userMeta, streakData, xpData] = session?.user?.id
    ? await Promise.all([
        db.follow.count({ where: { followingId: session.user.id } }),
        db.follow.count({ where: { followerId:  session.user.id } }),
        db.userProfile.findUnique({ where: { userId: session.user.id } }),
        db.user.findUnique({ where: { id: session.user.id }, select: { lastLoginAt: true, image: true } }),
        db.streak.findUnique({ where: { userId: session.user.id } }),
        db.userXP.findUnique({ where: { userId: session.user.id } }),
      ])
    : [0, 0, null, null, null, null]

  const currentImage = userMeta?.image ?? session?.user?.image ?? null
  const totalXP    = xpData?.totalXP ?? 0
  const levelInfo  = deriveLevel(totalXP)
  const streak     = streakData?.currentStreak ?? 0

  const profileSections = [
    {
      title:       'Datos personales',
      editSection: 'personal' as const,
      items: [
        { label: 'Nombre',              value: session?.user?.name ?? '—' },
        { label: 'Email',               value: session?.user?.email ?? '—' },
        { label: 'Rol',                 value: session?.user?.role ?? 'USER' },
        {
          label: 'Fecha de nacimiento',
          value: profile?.birthDate
            ? `${formatBirthDate(profile.birthDate)} (${calculateAge(profile.birthDate)} años)`
            : '—',
        },
        { label: 'Última conexión',     value: formatLastLogin(userMeta?.lastLoginAt) },
      ],
    },
    {
      title:       'Datos físicos',
      editSection: 'physical' as const,
      items: [
        { label: 'Peso',     value: profile ? `${profile.weight} kg` : '—' },
        { label: 'Altura',   value: profile ? `${profile.height} cm` : '—' },
        { label: 'Objetivo', value: profile ? (GOAL_LABEL[profile.goal] ?? profile.goal) : '—' },
      ],
    },
    {
      title:       'Preferencias de entrenamiento',
      editSection: 'training' as const,
      items: [
        { label: 'Nivel',         value: profile ? (LEVEL_LABEL[profile.level] ?? profile.level) : '—' },
        { label: 'Días/semana',   value: profile ? `${profile.daysPerWeek} días` : '—' },
        { label: 'Tipo',          value: profile ? (WORKOUT_LABEL[profile.workoutType] ?? profile.workoutType) : '—' },
      ],
    },
  ]

  const profileData = {
    name:        session?.user?.name  ?? '',
    birthDate:   profile?.birthDate   ? profile.birthDate.toISOString().slice(0, 10) : null,
    weight:      profile?.weight      ?? null,
    height:      profile?.height      ?? null,
    goal:        profile?.goal        ?? null,
    level:       profile?.level       ?? null,
    daysPerWeek: profile?.daysPerWeek ?? null,
    workoutType: profile?.workoutType ?? null,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full animate-fade-in">
      <h1 className="text-3xl font-black text-text-primary mb-8">Mi perfil</h1>

      {/* Avatar + stats */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-20 h-20 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center overflow-hidden">
            {currentImage
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={currentImage} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-4xl">👤</span>
            }
          </div>
          <AvatarPicker currentImage={currentImage} plan={session?.user?.plan ?? 'free'} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-black text-text-primary">{session?.user?.name ?? 'Atleta FitPrompt'}</h2>
          <p className="text-text-secondary text-sm mb-3">{session?.user?.email ?? ''}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-[#FF471A] font-black text-lg tabular-nums">🔥 {streak}</div>
              <div className="text-text-muted text-xs">Racha</div>
            </div>
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-text-primary font-black text-lg tabular-nums">⭐ {levelInfo.level}</div>
              <div className="text-text-muted text-xs">{levelInfo.levelName}</div>
            </div>
            <div className="bg-bg-tertiary rounded-xl px-4 py-2 text-center">
              <div className="text-text-primary font-black text-lg tabular-nums">{totalXP} XP</div>
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
          {session?.user?.role === 'ADMIN' && (
            <span className="bg-[#FF471A] text-white text-xs font-bold px-3 py-1 rounded-full text-center uppercase tracking-wide">
              Admin
            </span>
          )}
          <span className="bg-bg-tertiary border border-border-default text-text-secondary text-xs font-semibold px-3 py-1 rounded-full text-center capitalize">
            Plan {session?.user?.plan ?? 'Free'}
          </span>
          {session?.user?.plan !== 'premium' && (
            <Link
              href="/pricing"
              className="bg-[#FF471A] hover:bg-[#e03d15] text-white text-xs font-bold px-4 py-1.5 rounded-full text-center transition-colors"
            >
              Ir a Premium
            </Link>
          )}
        </div>
      </div>

      {/* Editable profile sections */}
      <div className="mb-6">
        <ProfileSections data={profileData} profileSections={profileSections} />
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
        {session?.user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-[#FF471A1A] border border-[#FF471A33] hover:border-[#FF471A66] rounded-xl px-5 py-4 text-[#FF471A] hover:text-[#ff6a44] transition-all"
          >
            <span className="text-sm font-bold">🛡️ Panel de administración</span>
            <span className="opacity-50">›</span>
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center justify-between bg-bg-secondary border border-border-default hover:border-text-subtle rounded-xl px-5 py-4 text-text-secondary hover:text-text-primary transition-all"
        >
          <span className="text-sm font-medium">⚙️ Configuración</span>
          <span className="text-text-muted">›</span>
        </Link>
        <ProfileActions />
      </div>
    </div>
  )
}

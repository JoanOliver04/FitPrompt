import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deriveLevel } from '@/lib/xp'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { BadgesGrid } from '@/components/profile/BadgesGrid'
import FollowButton from '@/components/profile/FollowButton'

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  return { title: user?.name ? `Perfil de ${user.name}` : 'Perfil' }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  const viewerId = session?.user?.id ?? null

  const [
    user,
    streak,
    xpRecord,
    workoutsCompleted,
    lastWeight,
    followersCount,
    followingCount,
    isFollowing,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, plan: true },
    }),
    db.streak.findUnique({
      where: { userId },
      select: { currentStreak: true, bestStreak: true },
    }),
    db.userXP.findUnique({
      where: { userId },
      select: { totalXP: true },
    }),
    db.workoutLog.count({ where: { userId, completed: true } }),
    db.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { weight: true },
    }),
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
    viewerId && viewerId !== userId
      ? db.follow
          .findFirst({ where: { followerId: viewerId, followingId: userId } })
          .then(Boolean)
      : Promise.resolve(false),
  ])

  if (!user) notFound()

  const totalXP = xpRecord?.totalXP ?? 0
  const { level, levelName } = deriveLevel(totalXP)
  const isOwnProfile = viewerId === userId
  const showFollowButton = !!viewerId && !isOwnProfile

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">

      {/* Back */}
      <Link
        href="/social"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Volver
      </Link>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? 'Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-[72px] h-[72px] rounded-2xl object-cover"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h1 className="text-xl font-black text-text-primary">
                      {user.name ?? 'Atleta'}
                    </h1>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-700/40 bg-green-900/20 text-green-400">
                      🌐 Público
                    </span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      user.plan === 'premium'
                        ? 'bg-[#FF471A1A] border border-[#FF471A33] text-[#FF471A]'
                        : 'bg-bg-tertiary border border-border-default text-text-muted'
                    }`}>
                      {user.plan === 'premium' ? '⚡ Premium' : 'Free'}
                    </span>
                    <span className="text-text-muted text-xs">{levelName}</span>
                  </div>
                </div>

                {showFollowButton && (
                  <FollowButton
                    targetUserId={userId}
                    initialIsFollowing={isFollowing as boolean}
                    initialFollowersCount={followersCount}
                  />
                )}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <StatChip label="Racha" value={`🔥 ${streak?.currentStreak ?? 0}`} highlight />
                <StatChip label="Mejor racha" value={`⚡ ${streak?.bestStreak ?? 0}`} />
                <StatChip label="Nivel" value={`⭐ ${level}`} />
                <StatChip label="XP" value={`${totalXP.toLocaleString()} XP`} />
                <StatChip label="Seguidores" value={String(followersCount)} />
                <StatChip label="Siguiendo" value={String(followingCount)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader title="Entrenamientos" />
          <CardContent>
            <p className="text-4xl font-black text-text-primary tabular-nums">{workoutsCompleted}</p>
            <p className="text-text-muted text-sm mt-1">sesiones completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Peso actual" />
          <CardContent>
            {lastWeight ? (
              <>
                <p className="text-4xl font-black text-text-primary tabular-nums">
                  {lastWeight.weight}{' '}
                  <span className="text-xl font-semibold text-text-muted">kg</span>
                </p>
                <p className="text-text-muted text-sm mt-1">último registro</p>
              </>
            ) : (
              <p className="text-text-muted text-sm py-2">Sin datos de peso</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Badges ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Logros"
          description={`Badges desbloqueados por ${user.name ?? 'este atleta'}`}
        />
        <CardContent>
          <BadgesGrid userId={userId} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-bg-tertiary rounded-xl px-3 py-2 text-center min-w-[56px]">
      <div className={`font-black text-sm ${highlight ? 'text-[#FF471A]' : 'text-text-primary'}`}>
        {value}
      </div>
      <div className="text-text-muted text-[10px] mt-0.5">{label}</div>
    </div>
  )
}

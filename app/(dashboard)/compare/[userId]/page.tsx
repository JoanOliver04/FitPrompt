import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deriveLevel } from '@/lib/xp'

export const metadata: Metadata = {
  title: 'Comparativa — FitPrompt',
}

interface Props {
  params: Promise<{ userId: string }>
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function getUserStats(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id:    true,
      name:  true,
      image: true,
      plan:  true,
      xp:      { select: { totalXP: true } },
      streak:  { select: { currentStreak: true, bestStreak: true } },
      weightLogs: {
        select:  { weight: true },
        orderBy: { date: 'desc' },
        take: 1,
      },
      _count: {
        select: { workoutLogs: true, achievements: true },
      },
    },
  })
}

type UserStats = NonNullable<Awaited<ReturnType<typeof getUserStats>>>

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileCard({
  user,
  level,
  levelName,
  accent,
}: {
  user: UserStats
  level: number
  levelName: string
  accent: 'orange' | 'indigo'
}) {
  const borderClass  = accent === 'orange' ? 'border-[#FF471A40]'       : 'border-indigo-500/25'
  const avatarBg     = accent === 'orange' ? 'bg-[#FF471A15]'           : 'bg-indigo-500/10'
  const avatarBorder = accent === 'orange' ? 'border-[#FF471A33]'       : 'border-indigo-500/20'
  const badgeBg      = accent === 'orange' ? 'bg-[#FF471A]/15'          : 'bg-indigo-500/15'
  const badgeText    = accent === 'orange' ? 'text-[#FF471A]'           : 'text-indigo-400'
  const badgeBorder  = accent === 'orange' ? 'border-[#FF471A]/30'      : 'border-indigo-500/30'

  return (
    <div className={`bg-bg-secondary border ${borderClass} rounded-2xl p-5 text-center flex flex-col items-center gap-2`}>
      <div className={`w-16 h-16 rounded-2xl ${avatarBg} border ${avatarBorder} flex items-center justify-center overflow-hidden shrink-0`}>
        {user.image
          ? <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
          : <span className="text-3xl">👤</span>
        }
      </div>
      <div>
        <p className="text-text-primary font-black text-sm leading-tight truncate max-w-[120px]">
          {user.name ?? 'Atleta'}
        </p>
        <p className="text-text-muted text-[11px] mt-0.5">
          Nv. {level} · {levelName}
        </p>
      </div>
      {user.plan === 'premium' && (
        <span className={`text-[9px] ${badgeBg} ${badgeText} border ${badgeBorder} px-1.5 py-0.5 rounded-full font-bold`}>
          PRO
        </span>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: string
  label: string
  myValue: number | null
  theirValue: number | null
  unit?: string
  higherIsBetter?: boolean
  noWinner?: boolean
  theirName: string
}

function StatCard({
  icon,
  label,
  myValue,
  theirValue,
  unit = '',
  higherIsBetter = true,
  noWinner = false,
  theirName,
}: StatCardProps) {
  const myNum    = myValue ?? 0
  const theirNum = theirValue ?? 0
  const maxVal   = Math.max(myNum, theirNum, 1)
  const myPct    = (myNum    / maxVal) * 100
  const theirPct = (theirNum / maxVal) * 100
  const myWins   = !noWinner && (higherIsBetter ? myNum > theirNum : myNum < theirNum)
  const tied     = myNum === theirNum

  const myBarColor    = myWins || noWinner   ? '#FF471A' : '#FF471A60'
  const theirBarColor = (!myWins && !tied) || noWinner ? '#6366F1' : '#6366F160'

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">

      {/* Header row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg leading-none">{icon}</span>
        <span className="text-text-secondary text-sm font-semibold">{label}</span>
        {!noWinner && (
          <span className={[
            'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
            tied
              ? 'bg-bg-tertiary text-text-muted'
              : myWins
                ? 'bg-[#FF471A]/10 text-[#FF471A]'
                : 'bg-indigo-500/10 text-indigo-400',
          ].join(' ')}>
            {tied ? '⚖️ Empate' : myWins ? '🏆 Tú ganas' : `🏆 ${theirName}`}
          </span>
        )}
      </div>

      {/* Values row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="text-left">
          <div className={[
            'text-3xl font-black tabular-nums leading-none',
            !noWinner && myWins ? 'text-[#FF471A]' : 'text-text-primary',
          ].join(' ')}>
            {myValue !== null ? `${myNum.toLocaleString('es')}${unit}` : '—'}
          </div>
          <div className="text-text-muted text-[10px] mt-1 font-semibold uppercase tracking-wider">Tú</div>
        </div>

        <div className="text-text-muted/20 text-xs font-black shrink-0">VS</div>

        <div className="text-right">
          <div className={[
            'text-3xl font-black tabular-nums leading-none',
            !noWinner && !myWins && !tied ? 'text-indigo-400' : 'text-text-primary',
          ].join(' ')}>
            {theirValue !== null ? `${theirNum.toLocaleString('es')}${unit}` : '—'}
          </div>
          <div className="text-text-muted text-[10px] mt-1 font-semibold uppercase tracking-wider">{theirName}</div>
        </div>
      </div>

      {/* Comparison bar */}
      {myValue !== null && theirValue !== null && (
        <div className="flex items-center gap-0.5">
          {/* My side — fills right from left edge, up to 50% of total width */}
          <div className="flex-1 h-2 bg-bg-tertiary rounded-l-full overflow-hidden flex justify-end">
            <div
              className="h-full rounded-l-full"
              style={{ width: `${myPct}%`, background: myBarColor, transition: 'width 0.6s ease' }}
            />
          </div>
          {/* Center divider */}
          <div className="w-px h-3 bg-border-default shrink-0" />
          {/* Their side — fills left from right edge */}
          <div className="flex-1 h-2 bg-bg-tertiary rounded-r-full overflow-hidden">
            <div
              className="h-full rounded-r-full"
              style={{ width: `${theirPct}%`, background: theirBarColor, transition: 'width 0.6s ease' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBanner({
  myWins,
  theirWins,
  ties,
  myName,
  theirName,
}: {
  myWins: number
  theirWins: number
  ties: number
  myName: string
  theirName: string
}) {
  const isMeWinner    = myWins > theirWins
  const isThemWinner  = theirWins > myWins
  const isOverallTied = myWins === theirWins

  return (
    <div className={[
      'rounded-2xl p-5 border text-center',
      isMeWinner
        ? 'bg-[#FF471A0D] border-[#FF471A33]'
        : isThemWinner
          ? 'bg-indigo-500/5 border-indigo-500/20'
          : 'bg-bg-secondary border-border-default',
    ].join(' ')}>
      <p className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-3">Resultado global</p>
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="text-center">
          <div className={`text-4xl font-black tabular-nums ${isMeWinner ? 'text-[#FF471A]' : 'text-text-primary'}`}>
            {myWins}
          </div>
          <div className="text-text-muted text-xs mt-0.5">{myName}</div>
        </div>
        <div className="text-text-muted/40 font-black text-sm">—</div>
        <div className="text-center">
          <div className={`text-4xl font-black tabular-nums ${isThemWinner ? 'text-indigo-400' : 'text-text-primary'}`}>
            {theirWins}
          </div>
          <div className="text-text-muted text-xs mt-0.5">{theirName}</div>
        </div>
      </div>
      {ties > 0 && (
        <p className="text-text-muted text-xs">{ties} empate{ties > 1 ? 's' : ''}</p>
      )}
      <p className={[
        'text-sm font-black mt-2',
        isMeWinner ? 'text-[#FF471A]' : isThemWinner ? 'text-indigo-400' : 'text-text-secondary',
      ].join(' ')}>
        {isMeWinner
          ? '🏆 ¡Vas ganando!'
          : isThemWinner
            ? `💪 ${theirName} va por delante`
            : '⚖️ Estáis igualados'}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { userId: theirId } = await params
  const myId = session.user.id

  if (myId === theirId) redirect('/profile')

  const [me, them] = await Promise.all([getUserStats(myId), getUserStats(theirId)])
  if (!me || !them) notFound()

  const myXP    = me.xp?.totalXP   ?? 0
  const theirXP = them.xp?.totalXP ?? 0
  const myLevel    = deriveLevel(myXP)
  const theirLevel = deriveLevel(theirXP)

  const theirFirstName = them.name?.split(' ')[0] ?? 'Atleta'
  const myFirstName    = me.name?.split(' ')[0]   ?? 'Tú'

  // Stats to compare (higherIsBetter assumed true unless noted)
  const stats: StatCardProps[] = [
    {
      icon: '💪', label: 'Entrenamientos',
      myValue: me._count.workoutLogs, theirValue: them._count.workoutLogs,
      theirName: theirFirstName,
    },
    {
      icon: '🔥', label: 'Racha actual',
      myValue: me.streak?.currentStreak ?? 0, theirValue: them.streak?.currentStreak ?? 0,
      unit: ' sem', theirName: theirFirstName,
    },
    {
      icon: '⭐', label: 'Mejor racha histórica',
      myValue: me.streak?.bestStreak ?? 0, theirValue: them.streak?.bestStreak ?? 0,
      unit: ' sem', theirName: theirFirstName,
    },
    {
      icon: '⚡', label: 'Experiencia (XP)',
      myValue: myXP, theirValue: theirXP,
      theirName: theirFirstName,
    },
    {
      icon: '🏅', label: 'Logros desbloqueados',
      myValue: me._count.achievements, theirValue: them._count.achievements,
      theirName: theirFirstName,
    },
    {
      icon: '⚖️', label: 'Peso actual',
      myValue: me.weightLogs[0]?.weight ?? null, theirValue: them.weightLogs[0]?.weight ?? null,
      unit: ' kg', noWinner: true, theirName: theirFirstName,
    },
  ]

  // Score calculation (excluding noWinner stats)
  let myWinCount    = 0
  let theirWinCount = 0
  let tieCount      = 0
  for (const s of stats) {
    if (s.noWinner || s.myValue === null || s.theirValue === null) continue
    const higherIsBetter = s.higherIsBetter ?? true
    const myV    = s.myValue
    const theirV = s.theirValue
    if (myV === theirV) tieCount++
    else if (higherIsBetter ? myV > theirV : myV < theirV) myWinCount++
    else theirWinCount++
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-fade-in">

      {/* Back */}
      <Link
        href="/social"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors group"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Volver
      </Link>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary">Comparativa</h1>
        <p className="text-text-muted text-sm mt-0.5">
          {me.name ?? 'Tú'} vs {them.name ?? 'Atleta'}
        </p>
      </div>

      {/* Profile cards */}
      <div className="relative grid grid-cols-2 gap-4 mb-8">
        <ProfileCard user={me}   level={myLevel.level}    levelName={myLevel.levelName}    accent="orange" />
        <ProfileCard user={them} level={theirLevel.level} levelName={theirLevel.levelName} accent="indigo" />

        {/* VS badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full bg-bg-primary border-2 border-border-default flex items-center justify-center shadow-lg">
            <span className="text-[10px] font-black text-text-muted tracking-tight">VS</span>
          </div>
        </div>
      </div>

      {/* Score banner */}
      <div className="mb-6">
        <ScoreBanner
          myWins={myWinCount}
          theirWins={theirWinCount}
          ties={tieCount}
          myName={myFirstName}
          theirName={theirFirstName}
        />
      </div>

      {/* Stat cards */}
      <div className="space-y-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

    </div>
  )
}

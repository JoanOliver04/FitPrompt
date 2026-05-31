import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deriveLevel } from '@/lib/xp'
import EditPRButton from './EditPRButton'

export const metadata: Metadata = { title: 'Rankings' }

// ─── Category definitions ────────────────────────────────────────────────────
// Slug stays in the URL so it can be linked / shared without ambiguity.

type ExerciseSlug = 'bench' | 'squat' | 'deadlift' | 'pullups'
type Slug = ExerciseSlug | 'workouts' | 'level' | 'streak'

interface ExerciseCategory {
  slug:     ExerciseSlug
  label:    string
  kind:     'exercise'
  exercise: string   // canonical name stored in WorkoutExercise.name + PR table
  icon:     string
}
interface StatCategory {
  slug:  Exclude<Slug, ExerciseSlug>
  label: string
  kind:  'workouts' | 'level' | 'streak'
  icon:  string
}
type Category = ExerciseCategory | StatCategory

const CATEGORIES: Category[] = [
  { slug: 'bench',    label: 'Press banca', kind: 'exercise', exercise: 'Press banca', icon: '🏋️' },
  { slug: 'squat',    label: 'Sentadilla',  kind: 'exercise', exercise: 'Sentadilla',  icon: '🦵' },
  { slug: 'deadlift', label: 'Peso muerto', kind: 'exercise', exercise: 'Peso muerto', icon: '💪' },
  { slug: 'pullups',  label: 'Dominadas',   kind: 'exercise', exercise: 'Dominadas',   icon: '🤸' },
  { slug: 'workouts', label: 'Entrenamientos', kind: 'workouts', icon: '📈' },
  { slug: 'level',    label: 'Nivel',          kind: 'level',    icon: '⭐' },
  { slug: 'streak',   label: 'Racha',          kind: 'streak',   icon: '🔥' },
]

// Legacy `?ex=press banca` → new `?cat=bench`. Keeps existing bookmarks alive.
const LEGACY_EX_TO_SLUG: Record<string, ExerciseSlug> = {
  'press banca': 'bench',
  'sentadilla':  'squat',
  'peso muerto': 'deadlift',
  'dominadas':   'pullups',
}

function estimateOrm(weight: number, reps: number): number {
  if (weight === 0) return 0
  return weight * (1 + reps / 30)
}

interface RankingRow {
  pos:       number
  userId:    string
  name:      string
  image:     string | null
  primary:   string
  secondary: string | null
  extra:     string | null
  numeric:   number
  hasData:   boolean
  isManual:  boolean    // only meaningful when category kind === 'exercise'
}

export default async function GroupRankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>
  searchParams: Promise<{ cat?: string; ex?: string }>
}) {
  const [{ groupId }, sp] = await Promise.all([params, searchParams])
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // Resolve selected category (new `cat`, legacy `ex`, default first one)
  const requested =
    sp.cat ??
    (sp.ex ? LEGACY_EX_TO_SLUG[sp.ex.toLowerCase()] : undefined)
  const selected: Category =
    CATEGORIES.find((c) => c.slug === requested) ?? CATEGORIES[0]

  // ── Group + membership guard ──────────────────────────────────────────────
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
  if (!group) notFound()
  if (!group.members.some((m) => m.userId === userId)) notFound()

  const memberIds = group.members.map((m) => m.userId)
  const memberMap = new Map(group.members.map((m) => [m.userId, m.user]))

  // ── Per-category data fetch ───────────────────────────────────────────────
  let rows: RankingRow[] = []
  let myCurrentPR: { weight: number; reps: number } | null = null
  let formulaNote: string | null = null

  if (selected.kind === 'exercise') {
    const exerciseName = selected.exercise

    const [manualPRs, exerciseRows] = await Promise.all([
      db.userPersonalRecord.findMany({
        where:  { userId: { in: memberIds }, exercise: exerciseName },
        select: { userId: true, weight: true, reps: true },
      }),
      db.workoutExercise.findMany({
        where: {
          userId:     { in: memberIds },
          name:       { equals: exerciseName, mode: 'insensitive' },
          workoutLog: { is: { completed: true } },
        },
        select: { userId: true, reps: true, weight: true },
      }),
    ])

    // Compute log-derived best per user (only used as fallback when no manual PR)
    type Best = { orm: number; bestReps: number; bestWeight: number; maxWeight: number }
    const logBest = new Map<string, Best>()
    for (const ex of exerciseRows) {
      const orm = estimateOrm(ex.weight, ex.reps)
      const cur = logBest.get(ex.userId)
      if (!cur) {
        logBest.set(ex.userId, { orm, bestReps: ex.reps, bestWeight: ex.weight, maxWeight: ex.weight })
      } else {
        const better = orm > cur.orm
        logBest.set(ex.userId, {
          orm:        better ? orm : cur.orm,
          bestReps:   better ? ex.reps    : cur.bestReps,
          bestWeight: better ? ex.weight  : cur.bestWeight,
          maxWeight:  ex.weight > cur.maxWeight ? ex.weight : cur.maxWeight,
        })
      }
    }

    const manualMap = new Map(manualPRs.map((m) => [m.userId, m]))
    myCurrentPR = manualMap.get(userId)
      ? { weight: manualMap.get(userId)!.weight, reps: manualMap.get(userId)!.reps }
      : null

    rows = memberIds
      .map((id) => {
        const user   = memberMap.get(id)!
        const manual = manualMap.get(id)
        const log    = logBest.get(id)

        let primary   = '—'
        let secondary: string | null = null
        let extra:     string | null = null
        let numeric   = 0
        let hasData   = false
        const isManual = !!manual

        if (manual) {
          const orm = Math.round(estimateOrm(manual.weight, manual.reps) * 10) / 10
          primary   = orm > 0 ? `${orm} kg 1RM` : `${manual.reps} reps`
          secondary = manual.weight > 0
            ? `${manual.weight} kg × ${manual.reps}`
            : `Peso corporal × ${manual.reps}`
          extra     = 'marca declarada'
          numeric   = orm
          hasData   = true
        } else if (log) {
          const orm = Math.round(log.orm * 10) / 10
          primary   = orm > 0 ? `${orm} kg 1RM` : `${log.bestReps} reps`
          secondary = log.bestWeight > 0
            ? `${log.bestWeight} kg × ${log.bestReps}`
            : `Peso corporal × ${log.bestReps}`
          extra     = log.maxWeight > 0 ? `max ${log.maxWeight} kg` : null
          numeric   = orm
          hasData   = true
        }

        return {
          pos: 0,
          userId: id,
          name: displayName(user),
          image: user.image,
          primary, secondary, extra,
          numeric, hasData, isManual,
        }
      })
      .sort(sortRows)
      .map((row, i) => ({ ...row, pos: i + 1 }))

    formulaNote = '1RM estimado: peso × (1 + reps / 30). Tu marca declarada tiene prioridad sobre los logs.'

  } else if (selected.kind === 'workouts') {
    // Total completed workouts per member
    const counts = await db.workoutLog.groupBy({
      by: ['userId'],
      where: { userId: { in: memberIds }, completed: true },
      _count: { _all: true },
    })
    const countMap = new Map(counts.map((c) => [c.userId, c._count._all]))

    rows = memberIds
      .map((id) => {
        const user  = memberMap.get(id)!
        const total = countMap.get(id) ?? 0
        return {
          pos: 0,
          userId: id,
          name: displayName(user),
          image: user.image,
          primary:   total > 0 ? `${total} ${total === 1 ? 'entreno' : 'entrenos'}` : '—',
          secondary: null,
          extra:     null,
          numeric:   total,
          hasData:   total > 0,
          isManual:  false,
        }
      })
      .sort(sortRows)
      .map((row, i) => ({ ...row, pos: i + 1 }))

  } else if (selected.kind === 'level') {
    const xpRows = await db.userXP.findMany({
      where:  { userId: { in: memberIds } },
      select: { userId: true, totalXP: true },
    })
    const xpMap = new Map(xpRows.map((x) => [x.userId, x.totalXP]))

    rows = memberIds
      .map((id) => {
        const user    = memberMap.get(id)!
        const totalXP = xpMap.get(id) ?? 0
        const info    = deriveLevel(totalXP)
        return {
          pos: 0,
          userId: id,
          name: displayName(user),
          image: user.image,
          primary:   `Nv. ${info.level} · ${info.levelName}`,
          secondary: `${totalXP.toLocaleString('es')} XP`,
          extra:     null,
          numeric:   totalXP,
          hasData:   totalXP > 0,
          isManual:  false,
        }
      })
      .sort(sortRows)
      .map((row, i) => ({ ...row, pos: i + 1 }))

  } else { // streak
    const streaks = await db.streak.findMany({
      where:  { userId: { in: memberIds } },
      select: { userId: true, currentStreak: true, bestStreak: true },
    })
    const streakMap = new Map(streaks.map((s) => [s.userId, s]))

    rows = memberIds
      .map((id) => {
        const user = memberMap.get(id)!
        const s    = streakMap.get(id)
        const best = s?.bestStreak ?? 0
        const cur  = s?.currentStreak ?? 0
        return {
          pos: 0,
          userId: id,
          name: displayName(user),
          image: user.image,
          primary:   best > 0 ? `🔥 ${best} ${best === 1 ? 'semana' : 'semanas'}` : '—',
          secondary: cur > 0 ? `actual: ${cur}` : null,
          extra:     null,
          numeric:   best,
          hasData:   best > 0,
          isManual:  false,
        }
      })
      .sort(sortRows)
      .map((row, i) => ({ ...row, pos: i + 1 }))
  }

  const myRow = rows.find((r) => r.userId === userId)

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">

      {/* Back */}
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {group.name}
      </Link>

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Rankings</h1>
          <p className="text-text-muted text-sm">{categoryBlurb(selected)}</p>
        </div>
        {selected.kind === 'exercise' && (
          <EditPRButton exercise={selected.exercise} initial={myCurrentPR} />
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = cat.slug === selected.slug
          return (
            <Link
              key={cat.slug}
              href={`/groups/${groupId}/rankings?cat=${cat.slug}`}
              className={[
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-all',
                isActive
                  ? 'bg-[#FF471A1A] text-[#FF471A] border-[#FF471A33]'
                  : 'bg-bg-tertiary text-text-muted border-border-default hover:text-text-primary',
              ].join(' ')}
            >
              <span aria-hidden>{cat.icon}</span>
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* My position banner */}
      {myRow && myRow.pos > 3 && myRow.hasData && (
        <div className="mb-4 flex items-center gap-3 p-3.5 rounded-xl bg-bg-tertiary border border-border-default">
          <span className="text-text-muted text-sm">Tu posición</span>
          <span className="text-text-primary font-black text-lg">#{myRow.pos}</span>
          <span className="ml-auto text-text-muted text-xs">{myRow.primary}</span>
        </div>
      )}

      {/* Ranking table */}
      <div className="rounded-2xl border border-border-default overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2.5 bg-bg-tertiary border-b border-border-default">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide text-center">#</span>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Atleta</span>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide text-right">{rightColLabel(selected)}</span>
        </div>

        {rows.every((r) => !r.hasData) ? (
          <div className="py-14 text-center">
            <p className="text-text-muted text-sm">{emptyMsg(selected)}</p>
          </div>
        ) : (
          rows.map((row) => {
            const isMe = row.userId === userId
            const medal =
              row.pos === 1 && row.hasData ? '🥇'
              : row.pos === 2 && row.hasData ? '🥈'
              : row.pos === 3 && row.hasData ? '🥉'
              : null

            return (
              <div
                key={row.userId}
                className={[
                  'grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center px-4 py-3.5 border-b border-border-default last:border-0',
                  isMe ? 'bg-[#FF471A08]' : 'hover:bg-bg-tertiary transition-colors',
                ].join(' ')}
              >
                <span className="text-sm font-bold text-text-muted text-center">
                  {medal ?? (row.hasData ? `#${row.pos}` : '—')}
                </span>

                <div className="flex items-center gap-2.5 min-w-0">
                  {row.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.image}
                      alt={row.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-bg-tertiary border border-border-default flex items-center justify-center shrink-0 text-base">
                      👤
                    </div>
                  )}
                  <p className="text-text-primary text-sm font-semibold truncate">
                    {row.name}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] text-[#FF471A] font-bold">Tú</span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  {row.hasData ? (
                    <>
                      <p className="text-text-primary text-sm font-bold tabular-nums">
                        {row.primary}
                      </p>
                      {row.secondary && (
                        <p className="text-text-muted text-[11px] tabular-nums">
                          {row.secondary}
                        </p>
                      )}
                      {row.extra && (
                        <p className="text-text-muted text-[11px] tabular-nums">
                          {row.extra}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-text-muted text-xs">Sin datos</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {formulaNote && (
        <p className="text-[11px] text-text-muted mt-4 text-center">
          {formulaNote}
        </p>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(user: { name: string | null; username: string | null }): string {
  return user.username ?? user.name ?? 'Atleta'
}

function sortRows(a: RankingRow, b: RankingRow): number {
  if (a.hasData !== b.hasData) return a.hasData ? -1 : 1
  return b.numeric - a.numeric
}

function categoryBlurb(c: Category): string {
  switch (c.kind) {
    case 'exercise': return 'Mejor 1RM estimado por ejercicio'
    case 'workouts': return 'Total de entrenamientos completados'
    case 'level':    return 'Nivel y XP total acumulado'
    case 'streak':   return 'Racha de semanas activas'
  }
}

function rightColLabel(c: Category): string {
  switch (c.kind) {
    case 'exercise': return 'Rendimiento'
    case 'workouts': return 'Entrenos'
    case 'level':    return 'Nivel'
    case 'streak':   return 'Mejor racha'
  }
}

function emptyMsg(c: Category): string {
  switch (c.kind) {
    case 'exercise': return `Ningún miembro ha registrado ${c.exercise} todavía`
    case 'workouts': return 'Ningún miembro ha completado entrenos todavía'
    case 'level':    return 'Ningún miembro tiene XP todavía'
    case 'streak':   return 'Aún no hay rachas registradas'
  }
}

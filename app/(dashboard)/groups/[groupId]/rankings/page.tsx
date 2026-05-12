import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const EXERCISES = ['Press banca', 'Sentadilla', 'Peso muerto', 'Dominadas'] as const
type Exercise = (typeof EXERCISES)[number]

interface WorkoutExercise {
  name: string
  sets: number
  reps: number
  weight: number
}

interface RankingRow {
  pos: number
  userId: string
  name: string
  image: string | null
  orm: number
  bestSet: string
  maxWeight: number
  hasData: boolean
}

function estimateOrm(weight: number, reps: number): number {
  if (weight === 0) return 0
  return weight * (1 + reps / 30)
}

export const metadata: Metadata = { title: 'Rankings' }

export default async function GroupRankingsPage({
  params,
  searchParams,
}: {
  params: { groupId: string }
  searchParams: { ex?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const group = await db.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()
  if (!group.members.some((m) => m.userId === userId)) notFound()

  const selected: Exercise =
    (EXERCISES.find(
      (e) => e.toLowerCase() === (searchParams.ex ?? '').toLowerCase()
    ) as Exercise | undefined) ?? EXERCISES[0]

  const memberIds = group.members.map((m) => m.userId)
  const memberMap = new Map(group.members.map((m) => [m.userId, m.user]))

  const logs = await db.workoutLog.findMany({
    where: { userId: { in: memberIds }, completed: true },
    select: { userId: true, exercises: true },
  })

  type UserBest = {
    orm: number
    bestReps: number
    bestWeight: number
    maxWeight: number
  }
  const bestMap = new Map<string, UserBest>()

  for (const log of logs) {
    const exercises = (
      Array.isArray(log.exercises) ? log.exercises : []
    ) as unknown as WorkoutExercise[]

    for (const ex of exercises) {
      if (ex.name.toLowerCase() !== selected.toLowerCase()) continue
      const orm = estimateOrm(ex.weight, ex.reps)
      const cur = bestMap.get(log.userId)

      if (!cur) {
        bestMap.set(log.userId, {
          orm,
          bestReps: ex.reps,
          bestWeight: ex.weight,
          maxWeight: ex.weight,
        })
      } else {
        const betterOrm = orm > cur.orm
        bestMap.set(log.userId, {
          orm: betterOrm ? orm : cur.orm,
          bestReps: betterOrm ? ex.reps : cur.bestReps,
          bestWeight: betterOrm ? ex.weight : cur.bestWeight,
          maxWeight: ex.weight > cur.maxWeight ? ex.weight : cur.maxWeight,
        })
      }
    }
  }

  const rows: RankingRow[] = memberIds
    .map((id) => {
      const user = memberMap.get(id)!
      const best = bestMap.get(id)
      return {
        userId: id,
        name: user.name ?? 'Atleta',
        image: user.image,
        hasData: !!best,
        orm: best ? Math.round(best.orm * 10) / 10 : 0,
        bestSet: best
          ? best.bestWeight > 0
            ? `${best.bestWeight} kg × ${best.bestReps}`
            : `Peso corporal × ${best.bestReps}`
          : '—',
        maxWeight: best?.maxWeight ?? 0,
      }
    })
    .sort((a, b) => {
      if (a.hasData !== b.hasData) return a.hasData ? -1 : 1
      return b.orm - a.orm
    })
    .map((row, i) => ({ ...row, pos: i + 1 }))

  const myRow = rows.find((r) => r.userId === userId)

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">

      {/* Back */}
      <Link
        href={`/groups/${params.groupId}`}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {group.name}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-primary">Rankings</h1>
        <p className="text-text-muted text-sm">Mejor 1RM estimado por ejercicio</p>
      </div>

      {/* Exercise tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {EXERCISES.map((ex) => {
          const isActive = ex === selected
          return (
            <Link
              key={ex}
              href={`/groups/${params.groupId}/rankings?ex=${encodeURIComponent(ex.toLowerCase())}`}
              className={[
                'px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-all',
                isActive
                  ? 'bg-[#FF471A1A] text-[#FF471A] border-[#FF471A33]'
                  : 'bg-bg-tertiary text-text-muted border-border-default hover:text-text-primary',
              ].join(' ')}
            >
              {ex}
            </Link>
          )
        })}
      </div>

      {/* My position banner */}
      {myRow && myRow.pos > 3 && (
        <div className="mb-4 flex items-center gap-3 p-3.5 rounded-xl bg-bg-tertiary border border-border-default">
          <span className="text-text-muted text-sm">Tu posición</span>
          <span className="text-text-primary font-black text-lg">#{myRow.pos}</span>
          <span className="ml-auto text-text-muted text-xs">
            {myRow.orm > 0 ? `${myRow.orm} kg 1RM` : 'Sin datos'}
          </span>
        </div>
      )}

      {/* Ranking table */}
      <div className="rounded-2xl border border-border-default overflow-hidden">

        {/* Header row */}
        <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-4 py-2.5 bg-bg-tertiary border-b border-border-default">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide text-center">#</span>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Atleta</span>
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide text-right">Rendimiento</span>
        </div>

        {rows.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-text-muted text-sm">
              Ningún miembro ha registrado {selected} todavía
            </p>
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
                {/* Position */}
                <span className="text-sm font-bold text-text-muted text-center">
                  {medal ?? `#${row.pos}`}
                </span>

                {/* User */}
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

                {/* Stats */}
                <div className="text-right">
                  {row.hasData ? (
                    <>
                      <p className="text-text-primary text-sm font-bold tabular-nums">
                        {row.orm > 0 ? `${row.orm} kg 1RM` : row.bestSet}
                      </p>
                      <p className="text-text-muted text-[11px] tabular-nums">
                        {row.bestSet}
                      </p>
                      {row.maxWeight > 0 && (
                        <p className="text-text-muted text-[11px] tabular-nums">
                          max {row.maxWeight} kg
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

      {/* Formula note */}
      <p className="text-[11px] text-text-muted mt-4 text-center">
        1RM estimado: peso × (1 + reps / 30)
      </p>
    </div>
  )
}

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getWeekStart } from '@/lib/challenges'
import { getChallengeProgress } from '@/lib/challenges-server'
import { ChallengeCard } from '@/components/challenges/ChallengeCard'
import type { ChallengeDifficulty } from '@/lib/challenges'

export const metadata: Metadata = {
  title: 'Retos — FitPrompt',
}

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ['easy', 'medium', 'hard', 'legendary']
const DIFFICULTY_SECTION: Record<ChallengeDifficulty, { label: string; sub: string }> = {
  easy:      { label: '🟢 Fácil',      sub: 'Para empezar o días ligeros'      },
  medium:    { label: '🟠 Medio',      sub: 'El punto dulce de la semana'      },
  hard:      { label: '🔴 Difícil',    sub: 'Para los que no conocen el límite' },
  legendary: { label: '🟣 Legendario', sub: 'Solo para los más bestias'         },
}

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const userId    = session.user.id
  const weekStart = getWeekStart()

  const accepted = await db.userChallenge.findMany({ where: { userId, weekStart } })
  const acceptedMap = new Map(accepted.map(a => [a.challengeId, a]))

  const challenges = await Promise.all(
    WEEKLY_CHALLENGES.map(async (def) => {
      const record   = acceptedMap.get(def.id)
      const progress = record ? await getChallengeProgress(userId, def.id) : 0
      return { definition: def, accepted: !!record, completed: record?.completed ?? false, progress }
    }),
  )

  const completedCount = challenges.filter(c => c.completed).length
  const totalXP        = challenges.filter(c => c.completed).reduce((s, c) => s + c.definition.xpReward, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-enter">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🎯</span>
              <h1 className="text-2xl font-black text-text-primary">Retos semanales</h1>
            </div>
            <p className="text-text-muted text-sm ml-14">
              Se reinician cada lunes · Gana XP extra
            </p>
          </div>

          {/* Stats pill */}
          {completedCount > 0 && (
            <div className="flex items-center gap-4 bg-bg-secondary border border-border-default rounded-2xl px-5 py-3">
              <div className="text-center">
                <p className="text-xl font-black text-text-primary">{completedCount}</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wide">completados</p>
              </div>
              <div className="w-px h-8 bg-border-default" />
              <div className="text-center">
                <p className="text-xl font-black text-[#FF471A]">+{totalXP}</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wide">XP ganados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grouped by difficulty */}
      <div className="space-y-8">
        {DIFFICULTY_ORDER.map(diff => {
          const group = challenges.filter(c => c.definition.difficulty === diff)
          if (!group.length) return null
          const { label, sub } = DIFFICULTY_SECTION[diff]

          return (
            <section key={diff}>
              <div className="mb-3">
                <h2 className="text-sm font-bold text-text-primary">{label}</h2>
                <p className="text-text-muted text-xs">{sub}</p>
              </div>
              <div className="space-y-3">
                {group.map(({ definition, accepted: acc, completed, progress }) => (
                  <ChallengeCard
                    key={definition.id}
                    definition={definition}
                    accepted={acc}
                    completed={completed}
                    progress={progress}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

    </div>
  )
}

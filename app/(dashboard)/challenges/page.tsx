import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getChallengeProgress, getWeekStart } from '@/lib/challenges'
import { ChallengeCard } from '@/components/challenges/ChallengeCard'

export const metadata: Metadata = {
  title: 'Retos — FitPrompt',
}

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId    = session.user.id
  const weekStart = getWeekStart()

  const accepted = await db.userChallenge.findMany({
    where: { userId, weekStart },
  })
  const acceptedMap = new Map(accepted.map(a => [a.challengeId, a]))

  const challenges = await Promise.all(
    WEEKLY_CHALLENGES.map(async (def) => {
      const record   = acceptedMap.get(def.id)
      const progress = record ? await getChallengeProgress(userId, def.id) : 0
      return { definition: def, accepted: !!record, completed: record?.completed ?? false, progress }
    }),
  )

  const completedCount = challenges.filter(c => c.completed).length
  const acceptedCount  = challenges.filter(c => c.accepted).length

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-enter">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎯</span>
          <h1 className="text-2xl font-bold text-text-primary">Retos semanales</h1>
        </div>
        <p className="text-text-muted text-sm ml-11">
          {completedCount > 0
            ? `${completedCount} de ${acceptedCount} retos completados esta semana`
            : 'Acepta un reto y gana XP extra. Se reinician cada lunes.'}
        </p>
      </div>

      {/* Challenge list */}
      <div className="space-y-4">
        {challenges.map(({ definition, accepted, completed, progress }) => (
          <ChallengeCard
            key={definition.id}
            definition={definition}
            accepted={accepted}
            completed={completed}
            progress={progress}
          />
        ))}
      </div>

    </div>
  )
}

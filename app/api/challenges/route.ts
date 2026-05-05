import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getChallengeProgress, getWeekStart } from '@/lib/challenges'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      return {
        id:          def.id,
        title:       def.title,
        description: def.description,
        icon:        def.icon,
        xpReward:    def.xpReward,
        target:      def.target,
        accepted:    !!record,
        completed:   record?.completed ?? false,
        progress,
      }
    }),
  )

  return NextResponse.json({ challenges })
}

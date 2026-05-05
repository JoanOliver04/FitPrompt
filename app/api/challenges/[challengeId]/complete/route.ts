import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getChallengeProgress, getWeekStart } from '@/lib/challenges'
import { addXP } from '@/lib/xp'

export async function POST(
  _req: NextRequest,
  { params }: { params: { challengeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { challengeId } = params
  const def = WEEKLY_CHALLENGES.find(c => c.id === challengeId)
  if (!def) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const weekStart = getWeekStart()
  const userId    = session.user.id

  const record = await db.userChallenge.findUnique({
    where: { userId_challengeId_weekStart: { userId, challengeId, weekStart } },
  })

  if (!record) {
    return NextResponse.json({ error: 'Challenge not accepted' }, { status: 400 })
  }

  if (record.completed) {
    return NextResponse.json({ xpGained: 0, levelUp: null })
  }

  const progress = await getChallengeProgress(userId, challengeId)
  if (progress < def.target) {
    return NextResponse.json({ error: 'Challenge not yet complete' }, { status: 400 })
  }

  await db.userChallenge.update({
    where: { id: record.id },
    data:  { completed: true, completedAt: new Date() },
  })

  const levelUp = await addXP(userId, def.xpReward).catch(() => null)

  return NextResponse.json({ xpGained: def.xpReward, levelUp })
}

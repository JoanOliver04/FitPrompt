import { NextResponse } from 'next/server'
import { z } from 'zod'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getWeekStart } from '@/lib/challenges'
import { getChallengeProgress } from '@/lib/challenges-server'
import { addXP } from '@/lib/xp'
import { checkAndAwardChallengeBadges } from '@/lib/badges'

export const runtime = 'nodejs'

const paramSchema = z.string().min(1).max(80)

export const POST = defineHandler(
  {
    auth: 'session',
    params: ({ challengeId }) => ({ challengeId: paramSchema.parse(challengeId) }),
    rateLimit: { key: ({ userId }) => `challenge-complete:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, params }) => {
    const def = WEEKLY_CHALLENGES.find(c => c.id === params.challengeId)
    if (!def) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    const weekStart = getWeekStart()
    const userId    = session.user.id

    const record = await db.userChallenge.findUnique({
      where: { userId_challengeId_weekStart: { userId, challengeId: params.challengeId, weekStart } },
    })
    if (!record) {
      return NextResponse.json({ error: 'Challenge not accepted' }, { status: 400 })
    }
    if (record.completed) {
      return NextResponse.json({ xpGained: 0, levelUp: null })
    }

    const progress = await getChallengeProgress(userId, params.challengeId)
    if (progress < def.target) {
      return NextResponse.json({ error: 'Challenge not yet complete' }, { status: 400 })
    }

    await db.userChallenge.update({
      where: { id: record.id },
      data:  { completed: true, completedAt: new Date() },
    })

    const [levelUp, newBadge] = await Promise.all([
      addXP(userId, def.xpReward).catch(() => null),
      checkAndAwardChallengeBadges(userId).catch(() => null),
    ])
    const badgePayload = newBadge ? { id: newBadge.id, name: newBadge.name, icon: newBadge.icon } : null
    return NextResponse.json({ xpGained: def.xpReward, levelUp, newBadge: badgePayload })
  },
)

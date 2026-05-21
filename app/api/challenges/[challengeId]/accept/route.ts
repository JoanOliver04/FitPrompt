import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { z } from 'zod'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getWeekStart } from '@/lib/challenges'

export const runtime = 'nodejs'

const paramSchema = z.string().min(1).max(80)

export const POST = defineHandler(
  {
    auth: 'session',
    params: ({ challengeId }) => ({ challengeId: paramSchema.parse(challengeId) }),
    rateLimit: { key: ({ userId }) => `challenge:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, params }) => {
    if (!WEEKLY_CHALLENGES.find(c => c.id === params.challengeId)) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }
    const weekStart = getWeekStart()
    await db.userChallenge.upsert({
      where:  { userId_challengeId_weekStart: { userId: session.user.id, challengeId: params.challengeId, weekStart } },
      create: { userId: session.user.id, challengeId: params.challengeId, weekStart },
      update: {},
    })
    return NextResponse.json({ ok: true })
  },
)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { addXP, XP_REWARDS, type LevelUpInfo } from '@/lib/xp'
import { checkAndAwardWeigher } from '@/lib/badges'
import { weightLogSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const logs = await db.weightLog.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    select:  { id: true, weight: true, date: true },
  })
  return NextResponse.json(
    { logs: logs.map((l) => ({ id: l.id, weight: l.weight, date: l.date.toISOString() })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export const POST = defineHandler(
  {
    auth: 'session',
    body: weightLogSchema,
    maxBodyBytes: 2 * 1024,
    rateLimit: { key: ({ userId }) => `weight:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, body }) => {
    const date = body.date ? new Date(body.date) : new Date()
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 422 })
    }

    const log = await db.weightLog.create({
      data:   { userId: session.user.id, weight: body.weight, date },
      select: { id: true, weight: true, date: true },
    })

    const levelUp: LevelUpInfo | null = await addXP(session.user.id, XP_REWARDS.WEIGHT_LOG).catch(() => null)
    const xpGained = XP_REWARDS.WEIGHT_LOG
    const badge = await checkAndAwardWeigher(session.user.id).catch(() => null)
    const newBadge = badge ? { id: badge.id, name: badge.name, icon: badge.icon } : null

    return NextResponse.json(
      { log: { id: log.id, weight: log.weight, date: log.date.toISOString() }, levelUp, xpGained, newBadge },
      { status: 201 },
    )
  },
)

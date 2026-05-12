import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getWeekStart } from '@/lib/challenges'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { challengeId } = await params
  if (!WEEKLY_CHALLENGES.find(c => c.id === challengeId)) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const weekStart = getWeekStart()
  const userId    = session.user.id

  await db.userChallenge.upsert({
    where:  { userId_challengeId_weekStart: { userId, challengeId, weekStart } },
    create: { userId, challengeId, weekStart },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

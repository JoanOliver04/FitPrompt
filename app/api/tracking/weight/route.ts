import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { addXP, XP_REWARDS, type LevelUpInfo } from '@/lib/xp'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const logs = await db.weightLog.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    select:  { id: true, weight: true, date: true },
  })

  return NextResponse.json({
    logs: logs.map((l) => ({ id: l.id, weight: l.weight, date: l.date.toISOString() })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const weight = raw?.weight

  if (typeof weight !== 'number' || weight <= 0 || weight > 500) {
    return NextResponse.json({ error: 'Peso inválido (debe ser entre 1 y 500 kg)' }, { status: 422 })
  }

  const dateRaw = typeof raw?.date === 'string' && raw.date ? raw.date : null
  const date    = dateRaw ? new Date(dateRaw) : new Date()

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 422 })
  }

  const log = await db.weightLog.create({
    data:   { userId: session.user.id, weight, date },
    select: { id: true, weight: true, date: true },
  })

  const levelUp: LevelUpInfo | null = await addXP(session.user.id, XP_REWARDS.WEIGHT_LOG).catch(() => null)

  return NextResponse.json(
    { log: { id: log.id, weight: log.weight, date: log.date.toISOString() }, levelUp },
    { status: 201 },
  )
}

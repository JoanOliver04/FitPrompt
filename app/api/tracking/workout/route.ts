import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateStreakIfWeekComplete } from '@/lib/streak'
import { addXP, XP_REWARDS, type LevelUpInfo } from '@/lib/xp'
import { checkAndAwardConsistency } from '@/lib/badges'
import { notifyRankSurpassed } from '@/lib/notifications'
import type { WorkoutExercise } from '@/components/tracking/WorkoutLogger'

// ─── GET — last 50 workout logs ───────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.workoutLog.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    take:    50,
    select:  { id: true, date: true, exercises: true, duration: true, completed: true, notes: true },
  })

  return NextResponse.json({
    logs: rows.map(serialize),
  })
}

// ─── POST — create a workout log ──────────────────────────────────────────────

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

  // Validate exercises
  const exercises = raw.exercises
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: 'Se requiere al menos un ejercicio' }, { status: 422 })
  }

  for (const item of exercises) {
    const ex = item as Record<string, unknown>
    if (typeof ex.name !== 'string' || !ex.name.trim()) {
      return NextResponse.json({ error: 'Cada ejercicio debe tener nombre' }, { status: 422 })
    }
    if (typeof ex.sets !== 'number' || ex.sets < 1 || !Number.isInteger(ex.sets)) {
      return NextResponse.json({ error: 'Series debe ser un entero positivo' }, { status: 422 })
    }
    if (typeof ex.reps !== 'number' || ex.reps < 1 || !Number.isInteger(ex.reps)) {
      return NextResponse.json({ error: 'Reps debe ser un entero positivo' }, { status: 422 })
    }
    if (typeof ex.weight !== 'number' || ex.weight < 0) {
      return NextResponse.json({ error: 'Peso debe ser un número no negativo' }, { status: 422 })
    }
  }

  // Validate duration (minutes)
  const duration = raw.duration
  if (typeof duration !== 'number' || duration <= 0 || duration > 1440 || !Number.isInteger(duration)) {
    return NextResponse.json({ error: 'Duración inválida (1–1440 min)' }, { status: 422 })
  }

  const completed = raw.completed === true
  const notes     = typeof raw.notes === 'string' ? raw.notes.trim() : ''
  const dateRaw   = typeof raw.date === 'string' && raw.date ? raw.date : null
  const date      = dateRaw ? new Date(dateRaw) : new Date()

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 422 })
  }

  const [row, profile] = await Promise.all([
    db.workoutLog.create({
      data: {
        userId:    session.user.id,
        date,
        exercises: exercises as unknown as Parameters<typeof db.workoutLog.create>[0]['data']['exercises'],
        duration,
        completed,
        notes:     notes || null,
      },
      select: { id: true, date: true, exercises: true, duration: true, completed: true, notes: true },
    }),
    db.userProfile.findUnique({
      where:  { userId: session.user.id },
      select: { daysPerWeek: true },
    }),
  ])

  let levelUp: LevelUpInfo | null = null
  let newBadge: { id: string; name: string; icon: string } | null = null
  const xpGained = completed ? XP_REWARDS.WORKOUT_COMPLETE : 0

  if (completed) {
    const daysPerWeek = profile?.daysPerWeek ?? 4
    levelUp = await addXP(session.user.id, XP_REWARDS.WORKOUT_COMPLETE).catch(() => null)
    updateStreakIfWeekComplete(session.user.id, daysPerWeek).catch(() => undefined)
    notifyRankSurpassed(session.user.id, XP_REWARDS.WORKOUT_COMPLETE).catch(() => undefined)
    const badge = await checkAndAwardConsistency(session.user.id).catch(() => null)
    if (badge) newBadge = { id: badge.id, name: badge.name, icon: badge.icon }
  }

  return NextResponse.json({ log: serialize(row), levelUp, xpGained, newBadge }, { status: 201 })
}

// ─── Serializer ───────────────────────────────────────────────────────────────

function serialize(row: {
  id:        string
  date:      Date
  exercises: unknown
  duration:  number
  completed: boolean
  notes:     string | null
}) {
  return {
    id:        row.id,
    date:      row.date.toISOString(),
    exercises: (Array.isArray(row.exercises) ? row.exercises : []) as WorkoutExercise[],
    duration:  row.duration,
    completed: row.completed,
    notes:     row.notes ?? '',
  }
}

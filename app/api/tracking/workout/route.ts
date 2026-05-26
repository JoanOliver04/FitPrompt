import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateStreakIfWeekComplete } from '@/lib/streak'
import { addXP, XP_REWARDS, type LevelUpInfo } from '@/lib/xp'
import {
  checkAndAwardConsistency,
  checkAndAwardWorkoutMilestones,
  checkAndAwardVolumeMilestone,
  checkAndAwardLevel5,
} from '@/lib/badges'
import { notifyRankSurpassed } from '@/lib/notifications'
import { workoutLogSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await db.workoutLog.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    select:  {
      id: true, date: true, duration: true, completed: true, notes: true,
      exercises: {
        orderBy: { order: 'asc' },
        select:  { name: true, sets: true, reps: true, weight: true },
      },
    },
  })
  return NextResponse.json({ logs: rows.map(serialize) }, { headers: { 'Cache-Control': 'no-store' } })
}

export const POST = defineHandler(
  {
    auth: 'session',
    body: workoutLogSchema,
    maxBodyBytes: 64 * 1024,
    rateLimit: { key: ({ userId }) => `workout:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, body }) => {
    const date = body.date ? new Date(body.date) : new Date()
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 422 })
    }

    const row = await db.workoutLog.create({
      data: {
        userId:       session.user.id,
        date,
        duration:     body.duration,
        completed:    body.completed,
        notes:        body.notes || null,
        routineId:    body.routineId    ?? null,
        routineDayId: body.routineDayId ?? null,
        exercises: {
          create: body.exercises.map((ex, i) => ({
            userId: session.user.id,
            date,
            name:   ex.name,
            sets:   ex.sets,
            reps:   ex.reps,
            weight: ex.weight,
            order:  i,
          })),
        },
      },
      select: {
        id: true, date: true, duration: true, completed: true, notes: true,
        exercises: { orderBy: { order: 'asc' }, select: { name: true, sets: true, reps: true, weight: true } },
      },
    })

    let levelUp: LevelUpInfo | null = null
    let newBadge: { id: string; name: string; icon: string } | null = null
    const xpGained = body.completed ? XP_REWARDS.WORKOUT_COMPLETE : 0

    if (body.completed) {
      levelUp = await addXP(session.user.id, XP_REWARDS.WORKOUT_COMPLETE).catch(() => null)
      updateStreakIfWeekComplete(session.user.id).catch(() => undefined)
      notifyRankSurpassed(session.user.id, XP_REWARDS.WORKOUT_COMPLETE).catch(() => undefined)

      // Badge checks — first match wins for the response (all run regardless)
      const [consistency, milestones, volume, level5] = await Promise.all([
        checkAndAwardConsistency(session.user.id).catch(() => null),
        checkAndAwardWorkoutMilestones(session.user.id).catch(() => null),
        checkAndAwardVolumeMilestone(session.user.id).catch(() => null),
        checkAndAwardLevel5(session.user.id).catch(() => null),
      ])
      const firstBadge = consistency ?? milestones ?? volume ?? level5
      if (firstBadge) newBadge = { id: firstBadge.id, name: firstBadge.name, icon: firstBadge.icon }
    }

    return NextResponse.json({ log: serialize(row), levelUp, xpGained, newBadge }, { status: 201 })
  },
)

function serialize(row: {
  id: string; date: Date; duration: number; completed: boolean; notes: string | null
  exercises: { name: string; sets: number; reps: number; weight: number }[]
}) {
  return {
    id:        row.id,
    date:      row.date.toISOString(),
    exercises: row.exercises,
    duration:  row.duration,
    completed: row.completed,
    notes:     row.notes ?? '',
  }
}

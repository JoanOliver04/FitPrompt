import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { routineCreateSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const routines = await db.routine.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, createdAt: true,
      days: { select: { id: true, dayIndex: true, name: true, _count: { select: { exercises: true } } } },
    },
  })
  return NextResponse.json({ routines }, { headers: { 'Cache-Control': 'no-store' } })
}

export const POST = defineHandler(
  {
    auth: 'session',
    body: routineCreateSchema,
    maxBodyBytes: 64 * 1024,
    rateLimit: { key: ({ userId }) => `routines:${userId}`, limit: 20, windowSec: 60 },
  },
  async ({ session, body }) => {
    const routine = await db.routine.create({
      data: {
        userId: session.user.id,
        name:   body.name,
        days: {
          create: body.days.map((day) => ({
            dayIndex: day.dayIndex,
            name:     day.name,
            exercises: {
              create: (day.exercises ?? []).map((ex) => ({
                name:        ex.name,
                sets:        ex.sets,
                reps:        ex.reps,
                restSeconds: ex.restSeconds ?? null,
                order:       ex.order,
              })),
            },
          })),
        },
      },
      include: { days: { include: { exercises: true } } },
    })

    return NextResponse.json({ routine }, { status: 201 })
  },
)

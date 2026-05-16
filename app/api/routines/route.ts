import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ParsedRoutine } from '@/lib/routineParser'

export async function GET() {
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

  return NextResponse.json({ routines })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as ParsedRoutine & { name: string }

  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!Array.isArray(body.days) || body.days.length === 0) {
    return NextResponse.json({ error: 'days required' }, { status: 400 })
  }

  const routine = await db.routine.create({
    data: {
      userId: session.user.id,
      name:   body.name.trim(),
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
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { routineCreateSchema } from '@/lib/schemas'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const routine = await db.routine.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayIndex: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ routine })
}

// PUT replaces the full routine (name + days + exercises). Cheaper than diffing
// because the in-memory editor sends the whole tree on save.
export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const owner = await db.routine.findUnique({ where: { id }, select: { userId: true } })
  if (!owner || owner.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const raw = await req.json().catch(() => null) as unknown
  const parsed = routineCreateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }
  const body = parsed.data

  const updated = await db.$transaction(async (tx) => {
    // Wipe and recreate the day/exercise tree. onDelete: Cascade on RoutineDay
    // takes care of removing the exercises along with the days.
    await tx.routineDay.deleteMany({ where: { routineId: id } })

    return tx.routine.update({
      where: { id },
      data: {
        name: body.name,
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
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
    })
  })

  return NextResponse.json({ routine: updated })
}

// PATCH stays for the lightweight "rename only" flow used by some callers.
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const routine = await db.routine.findUnique({ where: { id }, select: { userId: true } })
  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({})) as { name?: unknown }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Nombre inválido' }, { status: 422 })
  }

  const updated = await db.routine.update({ where: { id }, data: { name } })
  return NextResponse.json({ routine: { id: updated.id, name: updated.name } })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const routine = await db.routine.findUnique({ where: { id }, select: { userId: true } })

  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.routine.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

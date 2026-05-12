import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

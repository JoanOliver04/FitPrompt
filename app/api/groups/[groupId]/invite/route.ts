import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── POST — invite (add) a member ────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { groupId } = await params

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, createdBy: true },
  })

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  }

  if (group.createdBy !== session.user.id) {
    return NextResponse.json({ error: 'Solo el creador puede invitar' }, { status: 403 })
  }

  const body = await req.json() as { userId?: string }
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!target) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

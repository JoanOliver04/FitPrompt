import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdminApi } from '@/lib/roles'
import { db } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const session = await getServerSession(authOptions)
  const { userId } = await params

  if (userId === session!.user.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta desde el panel' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (target.role === 'ADMIN') {
    return NextResponse.json({ error: 'No puedes eliminar a otro administrador' }, { status: 403 })
  }

  await db.user.delete({ where: { id: userId } })

  return NextResponse.json({ ok: true })
}

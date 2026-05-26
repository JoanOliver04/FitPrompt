import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { compare, hash } from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let currentPassword: string, newPassword: string
  try {
    const body = await req.json()
    currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    newPassword     = typeof body.newPassword     === 'string' ? body.newPassword     : ''
  } catch {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) {
    return NextResponse.json(
      { error: 'Tu cuenta está vinculada a Google. No puedes cambiar la contraseña desde aquí.' },
      { status: 400 },
    )
  }

  const valid = await compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
  }

  const hashed = await hash(newPassword, 12)

  await db.user.update({
    where: { id: user.id },
    data: {
      password:       hashed,
      sessionVersion: { increment: 1 },
    },
  })

  logger.info('password_changed', { userId: user.id })
  return NextResponse.json({ ok: true })
}

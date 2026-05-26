import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  let token: string, password: string
  try {
    const body = await req.json()
    token    = typeof body.token    === 'string' ? body.token    : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (!token || !password) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const user = await db.user.findFirst({
    where: {
      resetPasswordToken:   token,
      resetPasswordExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'El enlace no es válido o ha expirado' }, { status: 400 })
  }

  const hashed = await hash(password, 12)

  await db.user.update({
    where: { id: user.id },
    data: {
      password:            hashed,
      resetPasswordToken:   null,
      resetPasswordExpires: null,
      sessionVersion:      { increment: 1 },
    },
  })

  logger.info('password_reset_completed', { userId: user.id })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { rateLimit, ipFrom } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  const ip = ipFrom(req)
  const ipGate = await rateLimit({ key: `forgot-pw:ip:${ip}`, limit: 5, windowSec: 300 })
  if (!ipGate.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
  }

  let email: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  } catch {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  // Find credential user (Google-only users can't reset password via email)
  const user = await db.user.findUnique({ where: { email } })
  if (user?.password) {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    })

    await sendPasswordResetEmail(email, token)
    logger.info('password_reset_requested', { userId: user.id })
  }

  // Always return success to prevent email enumeration
  return NextResponse.json({ ok: true })
}

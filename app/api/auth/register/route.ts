import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'node:crypto'
import { db } from '@/lib/db'
import { rateLimit, ipFrom } from '@/lib/rate-limit'
import { readJson, PayloadTooLargeError, InvalidContentTypeError } from '@/lib/http'
import { registerSchema } from '@/lib/schemas'
import { sendVerificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const UNIFORM_OK = NextResponse.json({ ok: true }, { status: 201 })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = ipFrom(req)

  const ipGate = await rateLimit({ key: `register:ip:${ip}`, limit: 5, windowSec: 60 * 60 })
  if (!ipGate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let raw: unknown
  try {
    raw = await readJson<unknown>(req, 8 * 1024)
  } catch (err) {
    if (err instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    if (err instanceof InvalidContentTypeError) {
      return NextResponse.json({ error: err.message }, { status: 415 })
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    // Validation errors are detailed enough for legitimate clients but never leak
    // whether the email exists.
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const { name, email, password } = parsed.data

  // Always run bcrypt + token gen so timing does not reveal account existence.
  const hashed = await hash(password, 12)
  const verifyToken = crypto.randomBytes(32).toString('hex')

  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!existing) {
      await db.user.create({
        data: {
          email,
          name,
          password: hashed,
          plan: 'free',
          emailVerifyToken:   verifyToken,
          emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      sendVerificationEmail(email, verifyToken).catch((err) => {
        logger.warn('verify_email_send_failed', { email, err: err instanceof Error ? err.message : String(err) })
      })
      logger.info('user_registered', { email })
    } else {
      logger.info('register_existing_email', { email })
    }
  } catch (err) {
    logger.error('register_db_failure', { err: err instanceof Error ? err.message : String(err) })
    // Still return uniform response.
  }

  return UNIFORM_OK
}

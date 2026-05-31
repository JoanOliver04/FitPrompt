import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { stripeIsConfigured } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Dev-only fake gateway: flips the caller to premium without any payment. Only
// reachable while Stripe is unconfigured — production installs with valid
// Stripe keys see a 404 from this endpoint, so it can never be used to bypass
// real billing.
export const POST = defineHandler(
  {
    auth: 'session',
    rateLimit: { key: ({ userId }) => `mock-confirm:${userId}`, limit: 5, windowSec: 60 },
  },
  async ({ session }) => {
    if (stripeIsConfigured()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, plan: true },
    })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.plan === 'premium') {
      return NextResponse.json({ error: 'Already premium' }, { status: 400 })
    }

    await db.user.update({
      where: { id: user.id },
      data:  { plan: 'premium' },
    })

    logger.info('mock_premium_activated', { userId: user.id })

    return NextResponse.json({ ok: true })
  },
)

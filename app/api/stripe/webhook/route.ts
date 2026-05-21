import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    logger.error('stripe_webhook_secret_missing', {})
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  // Raw body — never parse JSON before signature verification.
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    logger.security('stripe_webhook_invalid_signature', {
      msg: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency — Stripe may redeliver the same event id.
  const seen = await db.stripeEvent.findUnique({ where: { id: event.id }, select: { id: true } })
  if (seen) {
    return NextResponse.json({ received: true, duplicate: true })
  }
  await db.stripeEvent.create({ data: { id: event.id, type: event.type } })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = s.client_reference_id
        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: {
              plan: 'premium',
              stripeCustomerId: typeof s.customer === 'string' ? s.customer : undefined,
              sessionVersion:  { increment: 1 }, // forces session refresh on next request
            },
          })
          logger.info('plan_upgraded_premium', { userId, eventId: event.id })
        }
        break
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const user = await db.user.findFirst({
          where:  { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data:  { plan: 'free', sessionVersion: { increment: 1 } },
          })
          logger.info('plan_downgraded_free', { userId: user.id, eventId: event.id })
        }
        break
      }
      case 'invoice.payment_failed': {
        // Optional: dunning / email. Logged for now.
        const inv = event.data.object as Stripe.Invoice
        logger.warn('stripe_invoice_failed', { customer: inv.customer, eventId: event.id })
        break
      }
      default:
        // ignore unhandled event types
        break
    }
  } catch (err) {
    logger.error('stripe_webhook_handler_failed', {
      eventId: event.id, err: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { getStripe, stripeIsConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    rateLimit: { key: ({ userId }) => `checkout:${userId}`, limit: 5, windowSec: 60 * 60 },
  },
  async ({ session }) => {
    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, email: true, plan: true, stripeCustomerId: true },
    })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.plan === 'premium') {
      return NextResponse.json({ error: 'Already premium' }, { status: 400 })
    }

    // Stripe not wired up → route the user through the fictional checkout so
    // local/dev installs can still exercise the premium flow end-to-end.
    if (!stripeIsConfigured()) {
      return NextResponse.json({ url: '/mock-checkout' })
    }

    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!
    const stripe = getStripe()

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url:  `${baseUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
    })

    if (!checkout.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 502 })
    }

    return NextResponse.json({ url: checkout.url })
  },
)

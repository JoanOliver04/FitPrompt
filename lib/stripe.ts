import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('ROTATE_ME')) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  return _stripe
}

/**
 * True when Stripe is fully wired up (secret key + price id). When false, the
 * checkout flow falls back to /mock-checkout — a fictional gateway that just
 * flips the user's plan to premium. The mock is also the only state in which
 * /api/payment/mock-confirm will accept a request, so this single source of
 * truth gates the dev-only path everywhere.
 */
export function stripeIsConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  const price = process.env.STRIPE_PREMIUM_PRICE_ID
  return !!key && !key.startsWith('ROTATE_ME') && !!price
}

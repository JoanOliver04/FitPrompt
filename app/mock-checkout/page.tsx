import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripeIsConfigured } from '@/lib/stripe'
import MockCheckoutForm from './MockCheckoutForm'

export const metadata: Metadata = {
  title: 'Pasarela de pago — FitPrompt',
  robots: { index: false, follow: false },
}

export default async function MockCheckoutPage() {
  // Real Stripe wiring exists → this fictional page must not be reachable.
  if (stripeIsConfigured()) redirect('/pricing')

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { plan: true, email: true },
  })
  if (user?.plan === 'premium') redirect('/dashboard')

  return <MockCheckoutForm email={user?.email ?? ''} />
}

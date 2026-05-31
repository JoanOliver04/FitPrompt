import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardShell from '@/components/layout/DashboardShell'
import PageTransition from '@/components/layout/PageTransition'

// Single server-side auth guard for all (dashboard) pages.
// Middleware handles the common case via a fast JWT check; this catches
// edge cases such as revoked sessions where the JWT is still valid.
// Individual pages must NOT duplicate this with their own redirect('/login').
//
// Also enforces onboarding completion: a user can otherwise hit /dashboard
// by hammering the back button mid-onboarding (browser history bypass).
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await db.userProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  })
  if (!profile) redirect('/onboarding')

  return (
    <DashboardShell>
      <PageTransition>{children}</PageTransition>
    </DashboardShell>
  )
}

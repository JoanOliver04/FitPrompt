import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardShell from '@/components/layout/DashboardShell'
import PageTransition from '@/components/layout/PageTransition'

// Single server-side auth guard for all (dashboard) pages.
// Middleware handles the common case via a fast JWT check; this catches
// edge cases such as revoked sessions where the JWT is still valid.
// Individual pages must NOT duplicate this with their own redirect('/login').
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  return (
    <DashboardShell>
      <PageTransition>{children}</PageTransition>
    </DashboardShell>
  )
}

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Guard /onboarding so that:
//  • unauthenticated users get bounced to /login (defence in depth on top of middleware)
//  • users who already completed onboarding can't return here and overwrite their profile
//    (the POST handler also no-ops sensitive fields, but the page itself shouldn't render)
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const profile = await db.userProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  })
  if (profile) redirect('/dashboard')

  return <>{children}</>
}

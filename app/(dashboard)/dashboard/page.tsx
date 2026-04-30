import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getDashboardData, FALLBACK_DASHBOARD } from '@/lib/dashboard'
import WelcomeHeader from '@/components/dashboard/WelcomeHeader'
import MetricsGrid from '@/components/dashboard/MetricsGrid'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuickActions from '@/components/dashboard/QuickActions'

export const metadata: Metadata = {
  title: 'Dashboard — FitPrompt',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  let data = FALLBACK_DASHBOARD
  try {
    data = await getDashboardData(session.user.id, session.user.name ?? '')
  } catch {
    // DB unreachable — render with fallback values
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <WelcomeHeader name={data.name} streak={data.streak} />
      <MetricsGrid
        streak={data.streak}
        weight={data.weight}
        completionRate={data.completionRate}
        xpLevel={data.xpLevel}
        xpLevelName={data.xpLevelName}
        xpCurrent={data.xpCurrent}
        xpMax={data.xpMax}
      />
      <WeekCalendar completedDays={data.completedDaysThisWeek} />
      <TodayWorkout />
      <QuickActions />
    </div>
  )
}

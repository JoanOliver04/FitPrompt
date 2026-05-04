import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getDashboardData, FALLBACK_DASHBOARD } from '@/lib/dashboard'
import { getUserChats } from '@/lib/chat'
import WelcomeHeader from '@/components/dashboard/WelcomeHeader'
import MetricsGrid from '@/components/dashboard/MetricsGrid'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuickActions from '@/components/dashboard/QuickActions'
import { PlanDownloadCard } from '@/components/dashboard/PlanDownloadCard'

export const metadata: Metadata = {
  title: 'Dashboard — FitPrompt',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  let data = FALLBACK_DASHBOARD
  let latestChat: { id: string; title: string } | null = null

  try {
    const [dashboardData, chats] = await Promise.all([
      getDashboardData(session.user.id, session.user.name ?? ''),
      getUserChats(session.user.id),
    ])
    data = dashboardData
    // getUserChats orders by updatedAt desc — first entry is most recent.
    const first = chats[0]
    if (first) latestChat = { id: first.id, title: first.title }
  } catch {
    // DB unreachable — render with fallback values
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-enter">
      <WelcomeHeader
        name={data.name}
        streak={data.streak}
        bestStreak={data.bestStreak}
        weekComplete={data.weekComplete}
      />
      <MetricsGrid
        streak={data.streak}
        bestStreak={data.bestStreak}
        weekComplete={data.weekComplete}
        weight={data.weight}
        completionRate={data.completionRate}
        xpLevel={data.xpLevel}
        xpLevelName={data.xpLevelName}
        xpCurrent={data.xpCurrent}
        xpMax={data.xpMax}
      />
      <WeekCalendar completedDays={data.completedDaysThisWeek} />
      <QuickActions />

      {/* Plan download — only shown when the user has at least one chat */}
      {latestChat && (
        <div className="mt-6">
          <h2 className="text-text-primary font-bold mb-4">Tu plan</h2>
          <PlanDownloadCard chatId={latestChat.id} chatTitle={latestChat.title} />
        </div>
      )}

      <TodayWorkout />
    </div>
  )
}

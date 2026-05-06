import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import CheckoutSuccessAlert from '@/components/ui/CheckoutSuccessAlert'
import { getDashboardData, FALLBACK_DASHBOARD } from '@/lib/dashboard'
import { getUserChats } from '@/lib/chat'
import WelcomeHeader from '@/components/dashboard/WelcomeHeader'
import MetricsGrid from '@/components/dashboard/MetricsGrid'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuickActions from '@/components/dashboard/QuickActions'
import { PlanDownloadCard } from '@/components/dashboard/PlanDownloadCard'
import ProgressCards from '@/components/dashboard/ProgressCards'
import WeeklyCheckIn from '@/components/dashboard/WeeklyCheckIn'
import type { Plan } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard — FitPrompt',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

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
      <Suspense fallback={null}>
        <CheckoutSuccessAlert />
      </Suspense>

      <WelcomeHeader
        name={data.name}
        streak={data.streak}
        bestStreak={data.bestStreak}
        weekComplete={data.weekComplete}
      />
      <WeeklyCheckIn />
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
      <ProgressCards
        weightCurrent={data.weight}
        weightInitial={data.weightInitial}
        totalWorkouts={data.totalWorkouts}
        activeDays={data.activeDays}
        avgDuration={data.avgDuration}
      />
      <QuickActions />

      {/* Premium upsell — only for free plan users */}
      {plan === 'free' && (
        <Link href="/pricing" className="block mt-6 group">
          <div className="relative overflow-hidden bg-bg-secondary border border-[#FF471A]/20 hover:border-[#FF471A]/45 rounded-2xl p-4 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF471A]/[0.04] to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 text-xl select-none">
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary text-sm">Desbloquea todo el potencial</p>
                <p className="text-text-muted text-xs mt-0.5">Mensajes ilimitados, gráficas, grupos y más</p>
              </div>
              <span className="shrink-0 bg-[#FF471A] group-hover:bg-[#e03d15] text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors">
                Hazte Premium
              </span>
            </div>
          </div>
        </Link>
      )}

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

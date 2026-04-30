import type { Metadata } from 'next'
import WelcomeHeader from '@/components/dashboard/WelcomeHeader'
import MetricsGrid from '@/components/dashboard/MetricsGrid'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuickActions from '@/components/dashboard/QuickActions'

export const metadata: Metadata = {
  title: 'Dashboard — FitPrompt',
}

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <WelcomeHeader />
      <MetricsGrid />
      <WeekCalendar />
      <TodayWorkout />
      <QuickActions />
    </div>
  )
}

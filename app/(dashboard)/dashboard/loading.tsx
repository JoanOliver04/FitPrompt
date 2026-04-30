import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">

      {/* WelcomeHeader */}
      <div className="mb-6">
        <Skeleton className="h-7 w-52 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* MetricsGrid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* WeekCalendar */}
      <div className="mb-6">
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-xl" />
          ))}
        </div>
      </div>

      {/* TodayWorkout */}
      <div className="mb-6">
        <Skeleton className="h-5 w-44 mb-3" />
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* QuickActions */}
      <div>
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
          ))}
        </div>
      </div>

    </div>
  )
}

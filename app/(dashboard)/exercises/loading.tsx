import { Skeleton } from '@/components/ui/Skeleton'

export default function ExercisesLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-72 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-xl mb-5" />

      {/* Filter rows */}
      <div className="space-y-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-14 rounded-full shrink-0" />
            <div className="flex gap-1.5 overflow-hidden flex-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-16 shrink-0 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Count */}
      <Skeleton className="h-3 w-28 mb-4" />

      {/* Exercise grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
            <Skeleton className="h-28 rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

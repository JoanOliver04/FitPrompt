import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-bg-secondary border border-border-default rounded-2xl p-4', className)}>
      <Skeleton className="h-8 w-8 mb-2 rounded-lg" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-12 mb-0.5" />
      <Skeleton className="h-3 w-20 mt-0.5" />
    </div>
  )
}

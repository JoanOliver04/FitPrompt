import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean
  hoverable?: boolean
}

export default function Card({ accent, hoverable, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1a1a1a] border rounded-2xl',
        accent ? 'border-[#FF471A33] bg-[#FF471A08]' : 'border-[#2a2a2a]',
        hoverable && 'transition-all hover:border-[#FF471A44] hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

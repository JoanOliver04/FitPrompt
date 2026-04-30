import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean
  hoverable?: boolean
  shadow?: boolean
}

export function Card({ accent, hoverable, shadow, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-secondary border rounded-2xl transition-colors duration-300',
        accent
          ? 'border-[#FF471A33] bg-gradient-to-b from-[#FF471A08] to-bg-secondary'
          : 'border-border-default',
        hoverable && [
          'cursor-pointer transition-all duration-200',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
          accent ? 'hover:border-[#FF471A66]' : 'hover:border-[#FF471A44]',
        ],
        shadow && 'shadow-lg shadow-black/10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: ReactNode
}

export function CardHeader({
  title,
  description,
  action,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-5 pt-5', className)} {...props}>
      {(title || description || children) && (
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="text-text-primary font-bold text-base leading-tight">{title}</h3>
          )}
          {description && (
            <p className="text-text-muted text-xs mt-0.5">{description}</p>
          )}
          {children}
        </div>
      )}
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  )
}

// ─── CardContent ──────────────────────────────────────────────────────────────

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean
}

export function CardFooter({ bordered, className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('px-5 pb-5', bordered && 'border-t border-border-default pt-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Default export (backward compat) ─────────────────────────────────────────

export default Card

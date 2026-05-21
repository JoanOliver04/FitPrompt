import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export default function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full bg-bg-tertiary border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150',
          error
            ? 'border-red-500 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
            : 'border-border-default focus:border-[#FF471A] focus:shadow-[0_0_0_3px_rgba(255,71,26,0.12)]',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}

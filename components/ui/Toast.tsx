'use client'

import { useState, useEffect } from 'react'
import type { ToastItem } from '@/context/ToastContext'

// ─── Single toast ──────────────────────────────────────────────────────────────

interface ToastProps {
  toast:     ToastItem
  onDismiss: (id: string) => void
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10)
    const exit  = setTimeout(() => setVisible(false), 3300)
    return () => { clearTimeout(enter); clearTimeout(exit) }
  }, [])

  const isXp    = toast.variant === 'xp'
  const isBadge = toast.variant === 'badge'

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className={[
        'pointer-events-auto cursor-pointer select-none',
        'flex items-center gap-3 rounded-2xl px-4 py-3',
        'bg-[#141414] border shadow-2xl shadow-black/60',
        'min-w-[180px] max-w-[260px]',
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-5',
        isXp    && 'border-[#FF471A]/25',
        isBadge && 'border-[#FF471A]/35',
      ].filter(Boolean).join(' ')}
    >
      {/* Icon */}
      {toast.icon && (
        <span className="text-xl leading-none shrink-0">{toast.icon}</span>
      )}

      {/* Content */}
      <div className="min-w-0">
        <p className={[
          'text-sm font-bold leading-tight',
          isXp ? 'text-[#FF471A]' : 'text-white',
        ].join(' ')}>
          {toast.title}
        </p>
        {toast.subtitle && (
          <p className="text-[11px] text-[#FF471A] font-semibold mt-0.5 leading-tight truncate">
            {toast.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Container ─────────────────────────────────────────────────────────────────

interface ContainerProps {
  toasts:    ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9998] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

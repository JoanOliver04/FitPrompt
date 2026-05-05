'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface NotifItem {
  id:        string
  type:      string
  title:     string
  body:      string | null
  href:      string | null
  read:      boolean
  createdAt: string
}

interface NotifData {
  notifications: NotifItem[]
  unreadCount:   number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'Ahora'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days  < 7)  return `${days}d`
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function notifIcon(type: string): string {
  if (type === 'new_follower')  return '👤'
  if (type === 'group_invite')  return '👥'
  if (type === 'rank_surpassed') return '🏆'
  return '🔔'
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onRead,
  onClose,
}: {
  notif:   NotifItem
  onRead:  (id: string) => void
  onClose: () => void
}) {
  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    onClose()
  }

  const body = (
    <div
      className={[
        'flex gap-3 px-4 py-3.5 transition-colors',
        notif.read ? 'hover:bg-bg-tertiary' : 'bg-[#FF471A06] hover:bg-[#FF471A0D]',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={[
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base',
        notif.read ? 'bg-bg-tertiary' : 'bg-[#FF471A15]',
      ].join(' ')}>
        {notifIcon(notif.type)}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={[
          'text-sm leading-snug',
          notif.read ? 'text-text-secondary' : 'text-text-primary font-semibold',
        ].join(' ')}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-text-muted text-xs mt-0.5 leading-snug">{notif.body}</p>
        )}
        <p className="text-text-muted text-[10px] mt-1.5 tabular-nums">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 bg-[#FF471A] rounded-full mt-1.5 shrink-0" />
      )}
    </div>
  )

  if (notif.href) {
    return (
      <Link href={notif.href} onClick={handleClick} className="block">
        {body}
      </Link>
    )
  }
  return (
    <button type="button" className="w-full text-left" onClick={handleClick}>
      {body}
    </button>
  )
}

// ─── Bell ─────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [data, setData]   = useState<NotifData>({ notifications: [], unreadCount: 0 })
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setData(await res.json())
    } catch {}
  }, [])

  // Initial fetch + polling every 60 s
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setData(prev => ({
      unreadCount: 0,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }))
  }

  function markOneRead(id: string) {
    setData(prev => ({
      unreadCount: Math.max(
        0,
        prev.unreadCount - (prev.notifications.find(n => n.id === id && !n.read) ? 1 : 0),
      ),
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }))
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => undefined)
  }

  const hasUnread = data.unreadCount > 0

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Notificaciones"
        className="w-9 h-9 flex items-center justify-center rounded-xl text-text-subtle hover:text-text-primary hover:bg-bg-tertiary transition-all active:scale-95 relative"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF471A] rounded-full ring-2 ring-[var(--bg-glass)]" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-default rounded-2xl shadow-2xl overflow-hidden z-50 animate-enter">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">Notificaciones</span>
              {hasUnread && (
                <span className="text-[10px] bg-[#FF471A] text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {data.unreadCount > 9 ? '9+' : data.unreadCount}
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="text-[#FF471A] text-xs font-semibold hover:underline transition-opacity"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border-default">
            {data.notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl opacity-60">🔔</span>
                <p className="text-text-muted text-sm">Sin notificaciones</p>
              </div>
            ) : (
              data.notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRead={markOneRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {data.notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border-default text-center">
              <span className="text-text-muted text-xs">
                Últimas {data.notifications.length} notificaciones
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

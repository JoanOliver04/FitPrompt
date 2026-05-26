'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface FollowRequestItem {
  id:        string
  from:      { id: string; name: string | null; image: string | null }
  createdAt: string
}

interface GroupInvitationItem {
  id:      string
  group:   { id: string; name: string }
  inviter: { id: string; name: string | null }
  createdAt: string
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

// ─── Regular notification item ────────────────────────────────────────────────

function NotificationItem({
  notif,
  onRead,
  onDelete,
  onClose,
}: {
  notif:    NotifItem
  onRead:   (id: string) => void
  onDelete: (id: string) => void
  onClose:  () => void
}) {
  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    onClose()
  }

  const deleteBtn = (
    <button
      type="button"
      onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id) }}
      title="Eliminar notificación"
      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-red-400 transition-all shrink-0"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  )

  const body = (
    <div
      className={[
        'group flex gap-3 px-4 py-3.5 transition-colors',
        notif.read ? 'hover:bg-bg-tertiary' : 'bg-[#FF471A06] hover:bg-[#FF471A0D]',
      ].join(' ')}
    >
      <div className={[
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base',
        notif.read ? 'bg-bg-tertiary' : 'bg-[#FF471A15]',
      ].join(' ')}>
        {notifIcon(notif.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={['text-sm leading-snug', notif.read ? 'text-text-secondary' : 'text-text-primary font-semibold'].join(' ')}>
          {notif.title}
        </p>
        {notif.body && <p className="text-text-muted text-xs mt-0.5 leading-snug">{notif.body}</p>}
        <p className="text-text-muted text-[10px] mt-1.5 tabular-nums">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.read && <div className="w-2 h-2 bg-[#FF471A] rounded-full mt-1.5 shrink-0" />}
      {deleteBtn}
    </div>
  )

  if (notif.href) return <Link href={notif.href} onClick={handleClick} className="block">{body}</Link>
  return <button type="button" className="w-full text-left" onClick={handleClick}>{body}</button>
}

// ─── Follow request item ──────────────────────────────────────────────────────

function FollowRequestRow({
  req,
  onDone,
}: {
  req:    FollowRequestItem
  onDone: (id: string) => void
}) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  async function handle(action: 'accept' | 'reject') {
    setLoading(action)
    const method = action === 'accept' ? 'POST' : 'DELETE'
    await fetch(`/api/social/follow-requests/${req.id}`, { method })
    onDone(req.id)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#FF471A06]">
      <div className="w-9 h-9 rounded-xl bg-[#FF471A15] border border-[#FF471A30] flex items-center justify-center shrink-0 overflow-hidden">
        {req.from.image
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={req.from.image} alt="" className="w-full h-full object-cover" />
          : <span className="text-base">👤</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-xs font-semibold leading-tight truncate">
          {req.from.name ?? 'Alguien'} quiere seguirte
        </p>
        <p className="text-text-muted text-[10px] mt-0.5">{timeAgo(req.createdAt)}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('accept')}
          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#FF471A] text-white disabled:opacity-50 transition-all active:scale-95"
        >
          {loading === 'accept' ? '…' : 'Aceptar'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('reject')}
          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-bg-tertiary border border-border-default text-text-muted hover:text-red-400 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading === 'reject' ? '…' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}

// ─── Group invitation item ────────────────────────────────────────────────────

function GroupInvitationRow({
  inv,
  onDone,
}: {
  inv:    GroupInvitationItem
  onDone: (id: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  async function handle(action: 'accept' | 'reject') {
    setLoading(action)
    const method = action === 'accept' ? 'POST' : 'DELETE'
    const res = await fetch(`/api/groups/invitations/${inv.id}`, { method })
    if (action === 'accept' && res.ok) {
      const data = await res.json() as { groupId?: string }
      if (data.groupId) router.push(`/groups/${data.groupId}`)
    }
    onDone(inv.id)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#FF471A06]">
      <div className="w-9 h-9 rounded-xl bg-[#FF471A15] border border-[#FF471A30] flex items-center justify-center shrink-0 text-base">
        👥
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-xs font-semibold leading-tight">
          <span className="truncate">{inv.inviter.name ?? 'Alguien'}</span>
          {' '}te invita a{' '}
          <span className="text-[#FF471A] truncate">&quot;{inv.group.name}&quot;</span>
        </p>
        <p className="text-text-muted text-[10px] mt-0.5">{timeAgo(inv.createdAt)}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('accept')}
          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#FF471A] text-white disabled:opacity-50 transition-all active:scale-95"
        >
          {loading === 'accept' ? '…' : 'Unirse'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handle('reject')}
          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-bg-tertiary border border-border-default text-text-muted hover:text-red-400 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading === 'reject' ? '…' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border-b border-border-default">
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
      <span className="text-[9px] bg-[#FF471A] text-white font-black px-1.5 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

// ─── Bell ─────────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [data, setData]               = useState<NotifData>({ notifications: [], unreadCount: 0 })
  const [followReqs, setFollowReqs]   = useState<FollowRequestItem[]>([])
  const [groupInvs, setGroupInvs]     = useState<GroupInvitationItem[]>([])
  const [open, setOpen]               = useState(false)
  const ref                           = useRef<HTMLDivElement>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [notifRes, reqRes, invRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/social/follow-requests'),
        fetch('/api/groups/invitations'),
      ])
      if (notifRes.ok) setData(await notifRes.json())
      if (reqRes.ok)   setFollowReqs((await reqRes.json() as { requests: FollowRequestItem[] }).requests)
      if (invRes.ok)   setGroupInvs((await invRes.json() as { invitations: GroupInvitationItem[] }).invitations)
    } catch {}
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 60_000)
    return () => clearInterval(id)
  }, [fetchAll])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setData(prev => ({ unreadCount: 0, notifications: prev.notifications.map(n => ({ ...n, read: true })) }))
  }

  function markOneRead(id: string) {
    setData(prev => ({
      unreadCount: Math.max(0, prev.unreadCount - (prev.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }))
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => undefined)
  }

  function deleteOne(id: string) {
    const wasUnread = data.notifications.find(n => n.id === id && !n.read)
    setData(prev => ({
      unreadCount: Math.max(0, prev.unreadCount - (wasUnread ? 1 : 0)),
      notifications: prev.notifications.filter(n => n.id !== id),
    }))
    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => undefined)
  }

  async function deleteAll() {
    await fetch('/api/notifications', { method: 'DELETE' })
    setData({ notifications: [], unreadCount: 0 })
  }

  function removeFollowReq(id: string) { setFollowReqs(prev => prev.filter(r => r.id !== id)) }
  function removeGroupInv(id: string)  { setGroupInvs(prev => prev.filter(i => i.id !== id)) }

  const pendingCount = data.unreadCount + followReqs.length + groupInvs.length
  const hasAny = pendingCount > 0

  return (
    <div ref={ref} className="relative">
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
        {hasAny && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF471A] rounded-full ring-2 ring-[var(--bg-glass)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-default rounded-2xl shadow-2xl overflow-hidden z-50 animate-enter">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">Notificaciones</span>
              {pendingCount > 0 && (
                <span className="text-[10px] bg-[#FF471A] text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {data.unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[#FF471A] text-xs font-semibold hover:underline">
                  Marcar leídas
                </button>
              )}
              {data.notifications.length > 0 && (
                <button onClick={deleteAll} className="text-text-muted text-xs hover:text-red-400 transition-colors">
                  Borrar todo
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border-default">

            {/* Follow requests */}
            {followReqs.length > 0 && (
              <div>
                <SectionHeader label="Solicitudes de seguimiento" count={followReqs.length} />
                {followReqs.map(r => (
                  <FollowRequestRow key={r.id} req={r} onDone={removeFollowReq} />
                ))}
              </div>
            )}

            {/* Group invitations */}
            {groupInvs.length > 0 && (
              <div>
                <SectionHeader label="Invitaciones a grupos" count={groupInvs.length} />
                {groupInvs.map(i => (
                  <GroupInvitationRow key={i.id} inv={i} onDone={removeGroupInv} />
                ))}
              </div>
            )}

            {/* Regular notifications */}
            {data.notifications.length > 0 && (
              <div>
                {(followReqs.length > 0 || groupInvs.length > 0) && (
                  <SectionHeader label="Notificaciones" count={data.notifications.length} />
                )}
                {data.notifications.map(n => (
                  <NotificationItem key={n.id} notif={n} onRead={markOneRead} onDelete={deleteOne} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}

            {followReqs.length === 0 && groupInvs.length === 0 && data.notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-3xl opacity-60">🔔</span>
                <p className="text-text-muted text-sm">Sin notificaciones</p>
              </div>
            )}
          </div>

          {(data.notifications.length > 0 || followReqs.length > 0 || groupInvs.length > 0) && (
            <div className="px-4 py-2.5 border-t border-border-default text-center">
              <span className="text-text-muted text-xs">
                {data.notifications.length + followReqs.length + groupInvs.length} elemento{data.notifications.length + followReqs.length + groupInvs.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

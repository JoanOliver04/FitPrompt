'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export interface ChatListItem {
  id: string
  title: string
  updatedAt: Date | string
}

interface Props {
  initialChats: ChatListItem[]
  canCreateChat: boolean
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function ChatSidebar({ initialChats, canCreateChat }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const [chats, setChats] = useState<ChatListItem[]>(initialChats)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ChatListItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const editRef = useRef<HTMLInputElement>(null)

  const activeChatId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingId])

  const startRename = useCallback((chat: ChatListItem) => {
    setEditTitle(chat.title)
    setEditingId(chat.id)
  }, [])

  const submitRename = useCallback(async (chatId: string) => {
    const title = editTitle.trim()
    setEditingId(null)
    if (!title) return

    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c))

    const res = await fetch(`/api/chat/${chatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })

    if (!res.ok) router.refresh()
  }, [editTitle, router])

  const cancelRename = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
  }, [])

  const confirmDelete = useCallback(async (chat: ChatListItem) => {
    setPendingDelete(null)
    setChats(prev => prev.filter(c => c.id !== chat.id))

    const res = await fetch(`/api/chat/${chat.id}`, { method: 'DELETE' })

    if (!res.ok) {
      setChats(prev =>
        [chat, ...prev].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      )
      return
    }

    if (activeChatId === chat.id) {
      router.push('/chat')
    }
  }, [activeChatId, router])

  const createChat = useCallback(async () => {
    if (!canCreateChat || isCreating) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/chat/create', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/chat/${data.chat.id}`)
      router.refresh()
    } finally {
      setIsCreating(false)
    }
  }, [canCreateChat, isCreating, router])

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-bg-primary border-r border-border-default overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b border-border-default shrink-0">
        <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest px-1">
          Chats
        </span>
        <button
          onClick={createChat}
          disabled={!canCreateChat || isCreating}
          title={canCreateChat ? 'Nuevo chat' : 'Límite alcanzado — hazte Premium'}
          className={[
            'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
            canCreateChat && !isCreating
              ? 'bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white'
              : 'bg-bg-tertiary text-text-muted opacity-50 cursor-not-allowed',
          ].join(' ')}
        >
          {isCreating ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-default [&::-webkit-scrollbar-thumb:hover]:bg-text-muted">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
            <span className="text-2xl opacity-40">💬</span>
            <p className="text-text-muted text-xs leading-relaxed">
              Crea tu primer chat
            </p>
          </div>
        ) : (
          chats.map(chat => {
            const isActive = chat.id === activeChatId
            const isEditing = editingId === chat.id

            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => !isEditing && router.push(`/chat/${chat.id}`)}
                onKeyDown={e => e.key === 'Enter' && !isEditing && router.push(`/chat/${chat.id}`)}
                className={[
                  'group relative flex items-center gap-1 mx-1.5 my-0.5 rounded-xl',
                  'transition-all duration-150 cursor-pointer select-none focus:outline-none',
                  isActive
                    ? 'bg-[#FF471A0F] border border-[#FF471A28]'
                    : 'hover:bg-bg-tertiary border border-transparent',
                ].join(' ')}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#FF471A]" />
                )}

                <div className="flex-1 min-w-0 px-3 py-2.5">
                  {isEditing ? (
                    <input
                      ref={editRef}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => submitRename(chat.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitRename(chat.id)
                        if (e.key === 'Escape') cancelRename()
                      }}
                      onClick={e => e.stopPropagation()}
                      maxLength={100}
                      className="w-full bg-transparent text-text-primary text-sm font-medium outline-none border-b border-[#FF471A] pb-px"
                    />
                  ) : (
                    <p
                      className={[
                        'text-sm font-medium truncate transition-colors',
                        isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary',
                      ].join(' ')}
                    >
                      {chat.title}
                    </p>
                  )}
                  <p className="text-[10px] text-text-muted mt-0.5 tabular-nums">
                    {timeAgo(chat.updatedAt)}
                  </p>
                </div>

                {/* Action buttons — appear on hover / always on active */}
                {!isEditing && (
                  <div
                    className={[
                      'flex items-center gap-0.5 pr-1.5 shrink-0',
                      'transition-opacity duration-100',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    ].join(' ')}
                  >
                    <button
                      title="Renombrar"
                      onClick={e => { e.stopPropagation(); startRename(chat) }}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={e => { e.stopPropagation(); setPendingDelete(chat) }}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Delete confirmation sheet */}
      {pendingDelete && (
        <div className="shrink-0 p-3 border-t border-border-default bg-bg-secondary animate-enter">
          <p className="text-text-secondary text-xs mb-2.5 leading-snug">
            ¿Eliminar{' '}
            <span className="text-text-primary font-semibold">
              &ldquo;{pendingDelete.title}&rdquo;
            </span>
            ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => confirmDelete(pendingDelete)}
              className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white text-xs font-bold transition-all"
            >
              Eliminar
            </button>
            <button
              onClick={() => setPendingDelete(null)}
              className="flex-1 py-1.5 rounded-lg bg-bg-tertiary hover:bg-border-default text-text-subtle text-xs font-medium transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

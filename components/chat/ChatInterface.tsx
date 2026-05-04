'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useChat } from '@/hooks/useChat'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { ExportPdfButton } from './ExportPdfButton'
import type { Message } from '@/types'

const FREE_DAILY_LIMIT = 5

interface Props {
  chatId: string
  title?: string
  initialMessages?: Message[]
  /** Messages already used today. Passed from the server for accurate initial state. */
  messagesUsedToday?: number
  /** True when the user is on the Free plan. Controls counter visibility. */
  isFree?: boolean
}

export default function ChatInterface({
  chatId,
  title,
  initialMessages,
  messagesUsedToday,
  isFree,
}: Props) {
  const router = useRouter()

  // After the first exchange the backend auto-titles the chat.
  // router.refresh() re-fetches the server layout (sidebar + header title) without a full reload.
  const handleTitleGenerated = useCallback(() => {
    router.refresh()
  }, [router])

  const initialMessagesLeft =
    isFree && messagesUsedToday !== undefined
      ? Math.max(0, FREE_DAILY_LIMIT - messagesUsedToday)
      : undefined

  const { messages, isLoading, error, input, setInput, sendMessage, messagesLeft, clearError } =
    useChat(chatId, { initialMessages, initialMessagesLeft, onTitleGenerated: handleTitleGenerated })

  // For the counter display we need "used" not "remaining".
  const messagesUsed =
    messagesLeft !== null ? FREE_DAILY_LIMIT - messagesLeft : (messagesUsedToday ?? null)

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-border-default bg-bg-secondary shrink-0">
        <Link
          href="/chat"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all shrink-0"
          aria-label="Volver a chats"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>

        <div className="w-8 h-8 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-sm">🤖</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm truncate">
            {title ?? 'FitPrompt IA'}
          </p>
          <p className="text-text-muted text-xs">FitCoach · Entrenador IA</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <ExportPdfButton chatId={chatId} size="compact" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span className="text-text-secondary text-xs hidden sm:inline">Online</span>
          </div>
        </div>
      </header>

      {/* ── Messages ────────────────────────────────────────────── */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-4 py-2.5 bg-red-950/40 border-t border-red-800/30 shrink-0"
        >
          <p className="text-xs text-red-400 leading-relaxed">{error}</p>
          <button
            onClick={clearError}
            aria-label="Cerrar error"
            className="text-red-500 hover:text-red-300 transition-colors shrink-0 p-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Daily limit counter (Free plan only) ─────────────────
          Shown when we know the user is on Free AND have a count.
          Three visual states:
            · Normal  (>2 left): subtle orange bar
            · Warning (≤2 left): yellow bar + upgrade link
            · Blocked (0 left) : red bar + full message
      ──────────────────────────────────────────────────────────── */}
      {isFree && messagesLeft !== null && messagesUsed !== null && (
        <div className="px-4 py-2.5 border-t border-border-default bg-bg-secondary shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Progress bar */}
            <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  messagesLeft === 0
                    ? 'bg-red-500'
                    : messagesLeft <= 2
                    ? 'bg-yellow-500'
                    : 'bg-[#FF471A]'
                }`}
                style={{ width: `${(messagesUsed / FREE_DAILY_LIMIT) * 100}%` }}
              />
            </div>

            {/* Counter */}
            <span
              className={`text-xs font-medium tabular-nums shrink-0 ${
                messagesLeft === 0
                  ? 'text-red-400'
                  : messagesLeft <= 2
                  ? 'text-yellow-500'
                  : 'text-text-muted'
              }`}
            >
              {messagesUsed}/{FREE_DAILY_LIMIT} mensajes hoy
            </span>

            {/* Upgrade nudge — only when approaching the limit */}
            {messagesLeft <= 2 && (
              <Link
                href="/settings"
                className="text-[10px] font-bold text-[#FF471A] hover:underline underline-offset-2 shrink-0"
              >
                Premium
              </Link>
            )}
          </div>

          {/* Blocked message */}
          {messagesLeft === 0 && (
            <p className="text-xs text-red-400 mt-1.5">
              Has alcanzado el límite del plan Free.{' '}
              <Link href="/settings" className="font-bold underline underline-offset-2 hover:text-red-300">
                Hazte Premium
              </Link>{' '}
              para mensajes ilimitados.
            </p>
          )}
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────── */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading || messagesLeft === 0}
      />
    </div>
  )
}

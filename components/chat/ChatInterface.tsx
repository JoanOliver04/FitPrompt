'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useChat } from '@/hooks/useChat'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import type { Message } from '@/types'

interface Props {
  chatId: string
  title?: string
  initialMessages?: Message[]
}

export default function ChatInterface({ chatId, title, initialMessages }: Props) {
  const router = useRouter()

  // After the first successful exchange the backend auto-titles the chat.
  // router.refresh() re-fetches the server layout so the sidebar and header
  // show the new title without a full page reload.
  const handleTitleGenerated = useCallback(() => {
    router.refresh()
  }, [router])

  const { messages, isLoading, error, input, setInput, sendMessage, messagesLeft, clearError } =
    useChat(chatId, initialMessages, handleTitleGenerated)

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden">

      {/* Header */}
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

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-text-secondary text-xs">Online</span>
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Error banner — shown when API returns an error or network fails */}
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

      {/* Messages-left warning (free plan) */}
      {messagesLeft !== null && messagesLeft <= 2 && (
        <div className="px-4 py-2 bg-[#FF471A08] border-t border-[#FF471A22] text-center shrink-0">
          <p className="text-xs text-[#FF471A]">
            {messagesLeft === 0
              ? 'Has alcanzado el límite diario. '
              : `Te quedan ${messagesLeft} mensaje${messagesLeft !== 1 ? 's' : ''} hoy. `}
            <Link href="/settings" className="font-bold underline underline-offset-2">
              Hazte Premium
            </Link>
          </p>
        </div>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading || messagesLeft === 0}
      />
    </div>
  )
}

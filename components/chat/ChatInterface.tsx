'use client'

import Link from 'next/link'
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
  const { messages, isLoading, input, setInput, sendMessage, messagesLeft } = useChat(
    chatId,
    initialMessages,
  )

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
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
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

      {/* Messages-left warning (free plan) */}
      {messagesLeft !== null && messagesLeft <= 2 && (
        <div className="px-4 py-2 bg-[#FF471A08] border-t border-[#FF471A22] text-center">
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

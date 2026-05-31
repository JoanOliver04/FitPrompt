'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface Props {
  messages: Message[]
  isLoading: boolean
  chatId?:   string
}

export default function MessageList({ messages, isLoading, chatId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} chatId={chatId} />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  )
}

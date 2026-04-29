'use client'

import { useChat } from '@/hooks/useChat'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

interface Props {
  chatId: string
}

export default function ChatInterface({ chatId }: Props) {
  const { messages, isLoading, input, setInput, sendMessage } = useChat(chatId)

  return (
    <div className="flex flex-col h-screen max-h-screen bg-bg-primary">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary shrink-0">
        <div className="w-9 h-9 bg-accent-muted border border-accent/20 rounded-xl flex items-center justify-center">
          <span className="text-base">🤖</span>
        </div>
        <div>
          <p className="text-text-primary font-semibold text-sm">FitPrompt IA</p>
          <p className="text-text-muted text-xs">Chat #{chatId}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-text-secondary text-xs">Online</span>
        </div>
      </header>

      <MessageList messages={messages} isLoading={isLoading} />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading}
      />
    </div>
  )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import type { Message } from '@/types'

const WELCOME_MESSAGE = (chatId: string): Message => ({
  id: 'welcome',
  chatId,
  role: 'assistant',
  content:
    '¡Hola! Soy **FitPrompt**, tu entrenador personal y nutricionista IA 💪\n\nPuedo ayudarte con:\n- **Ajustar tu rutina** de entrenamiento\n- **Resolver dudas** sobre ejercicios o técnica\n- **Adaptar tu dieta** según tus necesidades\n- **Reorganizar la semana** si te saltas algún día\n\n¿En qué puedo ayudarte hoy?',
  createdAt: new Date(),
})

export interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  input: string
  setInput: (v: string) => void
  sendMessage: () => Promise<void>
  messagesLeft: number | null
  clearError: () => void
}

/**
 * @param chatId           - Chat ID used in the API call.
 * @param initialMessages  - Pre-loaded messages from the server.
 *                           Empty/undefined → show welcome message (new chat).
 *                           Non-empty → restore full history.
 * @param onTitleGenerated - Called once after the first successful exchange,
 *                           when the backend has auto-titled the chat.
 *                           Use router.refresh() here to sync the sidebar.
 */
export function useChat(
  chatId: string,
  initialMessages?: Message[],
  onTitleGenerated?: () => void,
): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [WELCOME_MESSAGE(chatId)],
  )
  const [input, setInput] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messagesLeft, setLeft] = useState<number | null>(null)

  // Fires onTitleGenerated exactly once — on the first successful exchange.
  const titleFired = useRef(!!(initialMessages && initialMessages.length > 0))

  const clearError = useCallback(() => setError(null), [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    // Optimistic update — immediately show the user message.
    const optimisticId = `optimistic-${Date.now()}`
    const userMsg: Message = {
      id: optimisticId,
      chatId,
      role: 'user',
      content: text,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    const rollback = () => {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(text)
    }

    try {
      const res = await fetch(`/api/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })

      const data: Record<string, unknown> = await res.json().catch(() => ({}))

      if (!res.ok) {
        rollback()

        if (res.status === 429) {
          setLeft(0)
          setError(
            typeof data.error === 'string'
              ? data.error
              : 'Has alcanzado el límite diario de mensajes.',
          )
          return
        }

        throw new Error(
          typeof data.error === 'string' ? data.error : `Error del servidor (${res.status})`,
        )
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        chatId,
        role: 'assistant',
        content: typeof data.content === 'string' ? data.content : '',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])

      if (typeof data.messagesLeft === 'number') {
        setLeft(data.messagesLeft)
      }

      // Notify caller that the backend has auto-titled the chat (first exchange only).
      if (!titleFired.current) {
        titleFired.current = true
        onTitleGenerated?.()
      }
    } catch (err) {
      rollback()
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }, [chatId, input, isLoading, onTitleGenerated])

  return { messages, isLoading, error, input, setInput, sendMessage, messagesLeft, clearError }
}

'use client'

import { useState, useCallback } from 'react'
import type { Message } from '@/types'

const MOCK_RESPONSES = [
  'Claro, puedo ayudarte con eso. Cuéntame más sobre tu situación actual y te daré una respuesta personalizada. 💪',
  'Buena pregunta. Basándome en los principios de periodización, lo más importante aquí es la progresión gradual. ¿Llevas registro de tus cargas?',
  'Para ese objetivo, la clave está en la combinación correcta de estímulo y recuperación. Sin descanso no hay adaptación.',
  'Depende mucho de tu contexto. ¿Estás en fase de volumen, definición o mantenimiento? Así puedo darte una respuesta más precisa.',
  'Eso es completamente normal en esa etapa del entrenamiento. Aquí te explico cómo ajustarlo:\n\n1. **Reduce la carga** un 10% esta semana\n2. **Prioriza el sueño** — mínimo 7-8h\n3. Vuelve a progresar la semana siguiente con base sólida.',
  'La nutrición y el entrenamiento son un sistema integrado. No puedes optimizar uno ignorando el otro. ¿Tienes controlados tus macros actualmente?',
]

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
  input: string
  setInput: (v: string) => void
  sendMessage: () => Promise<void>
  messagesLeft: number | null
}

/**
 * @param chatId     - The chat ID (used in the API call).
 * @param initialMessages - Messages pre-loaded from the server.
 *   - undefined or [] → show welcome message (new/empty chat)
 *   - non-empty array  → restore history (existing chat)
 */
export function useChat(chatId: string, initialMessages?: Message[]): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages
    return [WELCOME_MESSAGE(chatId)]
  })
  const [input, setInput]       = useState('')
  const [isLoading, setLoading] = useState(false)
  const [messagesLeft, setLeft] = useState<number | null>(null)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      chatId,
      role: 'user',
      content: text,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/api/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'api_error')
      }

      const data = await res.json()

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        chatId,
        role: 'assistant',
        content: data.content,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])

      if (typeof data.messagesLeft === 'number') {
        setLeft(data.messagesLeft)
      }
    } catch {
      // Fallback to a mock response when the API is unavailable
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 500))
      const content = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
      setMessages((prev) => [
        ...prev,
        { id: `mock-${Date.now()}`, chatId, role: 'assistant', content, createdAt: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }, [chatId, input, isLoading])

  return { messages, isLoading, input, setInput, sendMessage, messagesLeft }
}

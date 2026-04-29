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
  'Excelente progreso. Ahora toca subir la intensidad. En la Fase 3 tendré acceso completo a tu plan y podré darte recomendaciones más específicas. 🚀',
]

function makeMockReply(chatId: string): Message {
  const content = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  return {
    id: `mock-${Date.now()}`,
    chatId,
    role: 'assistant',
    content,
    createdAt: new Date(),
  }
}

function makeWelcome(chatId: string): Message {
  return {
    id: 'welcome',
    chatId,
    role: 'assistant',
    content:
      '¡Hola! Soy **FitPrompt**, tu entrenador personal y nutricionista IA 💪\n\nPuedo ayudarte con:\n- **Ajustar tu rutina** de entrenamiento\n- **Resolver dudas** sobre ejercicios o técnica\n- **Adaptar tu dieta** según tus necesidades\n- **Reorganizar la semana** si te saltas algún día\n\n¿En qué puedo ayudarte hoy?',
    createdAt: new Date(),
  }
}

export interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  input: string
  setInput: (v: string) => void
  sendMessage: () => Promise<void>
}

export function useChat(chatId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([makeWelcome(chatId)])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)

    try {
      const res = await fetch(`/api/chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })

      if (!res.ok) throw new Error('api_not_ready')

      const data = await res.json()
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        chatId,
        role: 'assistant',
        content: data.content,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 600))
      setMessages((prev) => [...prev, makeMockReply(chatId)])
    } finally {
      setIsLoading(false)
    }
  }, [chatId, input, isLoading])

  return { messages, isLoading, input, setInput, sendMessage }
}

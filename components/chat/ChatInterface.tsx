'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

const MOCK_WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content:
    '¡Hola! Soy FitPrompt, tu entrenador personal y nutricionista IA 💪\n\nPuedo ayudarte con:\n- **Ajustar tu rutina** de entrenamiento\n- **Resolver dudas** sobre ejercicios o técnica\n- **Adaptar tu dieta** según tus necesidades\n- **Reorganizar la semana** si te saltas un día\n\n¿En qué puedo ayudarte hoy?',
  createdAt: new Date(),
}

interface Props {
  chatId: string
}

export default function ChatInterface({ chatId }: Props) {
  const [messages, setMessages] = useState<Message[]>([MOCK_WELCOME])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Placeholder — will be replaced with real API call in Phase 3
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'La integración con la IA se configurará en la **Fase 03**. Por ahora el chat está listo estructuralmente.\n\n¡El diseño y la navegación ya funcionan! 🚀',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsLoading(false)
    }, 1200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a] shrink-0">
        <div className="w-9 h-9 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center">
          <span className="text-base">🤖</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">FitPrompt IA</p>
          <p className="text-[#666] text-xs">Chat #{chatId}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[#E0E0E0] text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">🤖</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#FF471A] text-white rounded-tr-sm'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#E0E0E0] rounded-tl-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
            />
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-sm">🤖</span>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#FF471A] animate-pulse-dot"
                  style={{ animationDelay: `${i * 0.16}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] shrink-0">
        <div className="flex items-end gap-3 bg-[#242424] border border-[#2a2a2a] focus-within:border-[#FF471A] rounded-2xl px-4 py-3 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje… (Enter para enviar)"
            className="flex-1 bg-transparent text-white placeholder-[#555] text-sm outline-none resize-none max-h-32"
            style={{ minHeight: '20px' }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-[#FF471A] hover:bg-[#e03d15] disabled:opacity-40 disabled:pointer-events-none text-white p-2 rounded-xl transition-all active:scale-95 shrink-0"
            aria-label="Enviar mensaje"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[#555] text-xs mt-2">
          Shift+Enter para nueva línea • Enter para enviar
        </p>
      </div>
    </div>
  )
}

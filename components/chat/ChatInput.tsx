'use client'

import { useRef } from 'react'

const QUICK_ACTIONS = [
  { label: '🛒 Lista de la compra', text: 'Dame la lista de la compra' },
  { label: '💪 Mi rutina',          text: 'Dame mi rutina de entrenamiento' },
  { label: '🥗 Mi dieta',           text: 'Dame un plan de dieta personalizado' },
] as const

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
}

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleQuickAction = (text: string) => {
    onChange(text)
    textareaRef.current?.focus()
  }

  return (
    <div className="p-4 border-t border-border-default bg-bg-secondary shrink-0">

      {/* Quick-action chips — only when input is empty */}
      {!value && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleQuickAction(action.text)}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-full border border-border-default text-text-secondary bg-bg-tertiary hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 bg-bg-tertiary border border-border-default focus-within:border-accent rounded-2xl px-4 py-3 transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje… (Enter para enviar)"
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted text-sm outline-none resize-none max-h-32"
          style={{ minHeight: '20px' }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none text-white p-2 rounded-xl transition-all active:scale-95 shrink-0"
          aria-label="Enviar mensaje"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-center text-text-muted text-xs mt-2">
        Shift+Enter para nueva línea · Enter para enviar
      </p>
    </div>
  )
}

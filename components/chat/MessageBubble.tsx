'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { Message } from '@/types'
import { SHOPPING_LIST_SENTINEL } from '@/types'
import { ShoppingListCard } from './ShoppingListCard'
import SaveRoutineButton from './SaveRoutineButton'
import DietPdfButton from './DietPdfButton'

interface Props {
  message: Message
  chatId?: string
}

function hasRoutineStructure(content: string): boolean {
  return /#{2,3}[^\n]{0,25}[Dd][íi]a\s+\d+/.test(content) && !/🥗/.test(content)
}

function hasDietStructure(content: string): boolean {
  // Day-level diet header (## 🥗 Día N ...) OR plan-level header OR at least
  // one meal-time block. Matches the heuristic in lib/pdf-parser.ts.
  return /##[^\n]{0,25}🥗/.test(content) ||
         /##\s*Plan de Alimentaci/i.test(content) ||
         /####\s*🕗?\s*\d{1,2}:\d{2}\s*—\s*(?:Desayuno|Almuerzo|Comida|Cena|Pre-entreno|Post-entreno|Merienda)/i.test(content)
}

// Allowlist of node renderers — anything not listed renders as plain text.
// We deliberately drop <script>, <iframe>, <img>, raw <a> with javascript:.
const components: Components = {
  h1: ({ children }) => <strong className="block text-base mt-4">{children}</strong>,
  h2: ({ children }) => <strong className="block text-base mt-4">{children}</strong>,
  h3: ({ children }) => <strong className="block text-sm  mt-3">{children}</strong>,
  h4: ({ children }) => <strong className="block text-sm">{children}</strong>,
  code: ({ children }) => (
    <code className="bg-accent/10 px-1 py-0.5 rounded text-[0.85em]">{children}</code>
  ),
  hr: () => <hr className="border-border-default my-2" />,
  ul: ({ children }) => <ul className="list-disc ml-5 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-5 my-2">{children}</ol>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left px-2 py-1 border border-border-default">{children}</th>,
  td: ({ children }) => <td className="px-2 py-1 border border-border-default">{children}</td>,
  a: ({ href, children }) =>
    typeof href === 'string' && /^https?:\/\//.test(href)
      ? (
        <a href={href} rel="noopener noreferrer nofollow" target="_blank" className="underline">
          {children}
        </a>
      )
      : <span>{children}</span>,
}

export default function MessageBubble({ message, chatId }: Props) {
  const isUser        = message.role === 'user'
  const isShoppingList = !isUser && message.content.startsWith(SHOPPING_LIST_SENTINEL)
  const isRoutine     = !isUser && !isShoppingList && hasRoutineStructure(message.content)
  const isDiet        = !isUser && !isShoppingList && hasDietStructure(message.content)

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-[#FF471A1A] border border-[#FF471A33] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-sm">🤖</span>
        </div>
      )}

      {isShoppingList ? (
        <ShoppingListCard content={message.content} />
      ) : (
        <div className={`max-w-[80%] ${!isUser ? 'flex flex-col' : ''}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-accent text-white rounded-tr-sm'
                : 'bg-bg-secondary border border-border-default text-text-secondary rounded-tl-sm'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
              skipHtml
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {isRoutine && (
            <div className="mt-1 ml-1">
              <SaveRoutineButton content={message.content} />
            </div>
          )}
          {isDiet && chatId && (
            <div className="mt-1 ml-1">
              <DietPdfButton chatId={chatId} messageId={message.id} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

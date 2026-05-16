import type { Message } from '@/types'
import { SHOPPING_LIST_SENTINEL } from '@/types'
import { ShoppingListCard } from './ShoppingListCard'
import SaveRoutineButton from './SaveRoutineButton'

interface Props {
  message: Message
}

// Detect if a message contains a structured workout routine from the AI
function hasRoutineStructure(content: string): boolean {
  // Allow any emoji/text prefix before "Día N" (up to 25 chars of prefix after ##)
  return /#{2,3}[^\n]{0,25}[Dd][íi]a\s+\d+/.test(content)
}

function renderContent(content: string): string {
  return content
    // Headings
    .replace(/^#{3}\s+(.+)$/gm, '<strong style="font-size:0.875rem;display:block;margin-top:0.75rem">$1</strong>')
    .replace(/^#{2}\s+(.+)$/gm, '<strong style="font-size:1rem;display:block;margin-top:1rem">$1</strong>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,71,26,0.1);padding:0.1em 0.3em;border-radius:3px;font-size:0.85em">$1</code>')
    // Unordered list items
    .replace(/^[-*]\s+(.+)$/gm, '<li style="margin-left:1rem;list-style:disc">$1</li>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr style="border-color:var(--border-default);margin:0.5rem 0">')
    // Line breaks (after block-level replacements)
    .replace(/\n/g, '<br />')
}

export default function MessageBubble({ message }: Props) {
  const isUser        = message.role === 'user'
  const isShoppingList = !isUser && message.content.startsWith(SHOPPING_LIST_SENTINEL)
  const isRoutine     = !isUser && !isShoppingList && hasRoutineStructure(message.content)

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
            dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
          />
          {isRoutine && (
            <div className="mt-1 ml-1">
              <SaveRoutineButton content={message.content} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

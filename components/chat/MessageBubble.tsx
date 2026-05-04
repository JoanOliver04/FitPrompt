import type { Message } from '@/types'
import { SHOPPING_LIST_SENTINEL } from '@/types'
import { ShoppingListCard } from './ShoppingListCard'

interface Props {
  message: Message
}

function renderContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isShoppingList = !isUser && message.content.startsWith(SHOPPING_LIST_SENTINEL)

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
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-accent text-white rounded-tr-sm'
              : 'bg-bg-secondary border border-border-default text-text-secondary rounded-tl-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
        />
      )}
    </div>
  )
}

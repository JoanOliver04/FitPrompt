import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createChat, countUserChats } from '@/lib/chat'
import type { Plan } from '@/types'

const FREE_CHAT_LIMIT = 3

/**
 * Server component that creates a new chat and immediately redirects to it.
 * Acts as a progressive-enhancement alternative to a client-side API call.
 */
export default async function NewChatPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  if (plan === 'free') {
    const count = await countUserChats(userId)
    if (count >= FREE_CHAT_LIMIT) {
      redirect('/chat?limitReached=1')
    }
  }

  const chat = await createChat(userId)
  redirect(`/chat/${chat.id}`)
}

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserChats, countUserChats } from '@/lib/chat'
import ChatSidebar from '@/components/chat/ChatSidebar'
import type { Plan } from '@/types'

const FREE_CHAT_LIMIT = 3

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  const [chats, chatCount] = await Promise.all([
    getUserChats(userId),
    countUserChats(userId),
  ])

  const canCreateChat = plan !== 'free' || chatCount < FREE_CHAT_LIMIT

  return (
    <div className="flex-1 flex overflow-hidden">
      <ChatSidebar initialChats={chats} canCreateChat={canCreateChat} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserChats, countUserChats } from '@/lib/chat'
import { getUserPlan } from '@/lib/limits'
import ChatSidebar from '@/components/chat/ChatSidebar'

const FREE_CHAT_LIMIT = 3

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const userId = session.user.id

  // Read the plan straight from DB instead of trusting the JWT — that token
  // only refreshes hourly, so a user who just upgraded would still see the
  // free-tier chat cap until their next forced refresh.
  const [chats, chatCount, plan] = await Promise.all([
    getUserChats(userId),
    countUserChats(userId),
    getUserPlan(userId),
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

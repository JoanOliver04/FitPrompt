import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserChats, getDailyCount } from '@/lib/chat'
import type { Plan } from '@/types'

const FREE_DAILY_LIMIT = 5
const FREE_CHAT_LIMIT = 3

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  const [chats, messagesUsedToday] = await Promise.all([
    getUserChats(userId),
    getDailyCount(userId),
  ])

  return NextResponse.json({
    chats,
    messagesUsedToday,
    dailyLimit: plan === 'free' ? FREE_DAILY_LIMIT : null,
    chatLimit: plan === 'free' ? FREE_CHAT_LIMIT : null,
  })
}

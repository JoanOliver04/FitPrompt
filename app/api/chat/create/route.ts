import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createChat, countUserChats } from '@/lib/chat'
import type { Plan } from '@/types'

const FREE_CHAT_LIMIT = 3

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  if (plan === 'free') {
    const count = await countUserChats(userId)
    if (count >= FREE_CHAT_LIMIT) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el límite de 3 chats del plan Free.',
          upgradeUrl: '/settings',
        },
        { status: 403 },
      )
    }
  }

  let title: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.title === 'string' && body.title.trim()) {
      title = body.title.trim()
    }
  } catch {
    // title is optional — ignore parse errors
  }

  const chat = await createChat(userId, title)
  return NextResponse.json({ chat }, { status: 201 })
}

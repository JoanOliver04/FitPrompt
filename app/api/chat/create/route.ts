import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createChat } from '@/lib/chat'
import { applyLimits } from '@/lib/limits'
import type { Plan } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = {
    id: session.user.id,
    plan: (session.user as { plan?: Plan }).plan ?? 'free',
  }

  const blocked = await applyLimits(user, { type: 'create_chat' })
  if (blocked) return blocked

  let title: string | undefined
  try {
    const body = await req.json()
    if (typeof body?.title === 'string' && body.title.trim()) {
      title = body.title.trim()
    }
  } catch {
    // title is optional — ignore parse errors
  }

  const chat = await createChat(user.id, title)
  return NextResponse.json({ chat }, { status: 201 })
}

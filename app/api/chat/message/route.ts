import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveMessage, verifyChatOwnership } from '@/lib/chat'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { chatId, content, role } = body as Record<string, unknown>

  if (typeof chatId !== 'string' || !chatId.trim()) {
    return NextResponse.json({ error: 'chatId must be a non-empty string' }, { status: 400 })
  }
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'content must be a non-empty string' }, { status: 400 })
  }
  if (role !== 'user' && role !== 'assistant') {
    return NextResponse.json({ error: 'role must be "user" or "assistant"' }, { status: 400 })
  }

  const owns = await verifyChatOwnership(chatId, session.user.id)
  if (!owns) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const message = await saveMessage(chatId, role, content.trim())
  return NextResponse.json({ message }, { status: 201 })
}

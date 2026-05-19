import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { createChat } from '@/lib/chat'
import { chatCreateSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    body: chatCreateSchema,
    planLimit: { type: 'create_chat' },
    rateLimit: { key: ({ userId }) => `chat-create:${userId}`, limit: 10, windowSec: 60 },
    maxBodyBytes: 2 * 1024,
  },
  async ({ session, body }) => {
    const chat = await createChat(session.user.id, body?.title)
    return NextResponse.json({ chat }, { status: 201 })
  },
)

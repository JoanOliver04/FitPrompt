import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { saveMessage, verifyChatOwnership } from '@/lib/chat'
import { stripHtml } from '@/lib/sanitize'
import { userSavedMessageSchema } from '@/lib/schemas'
import { checkAndAwardChatBadges } from '@/lib/badges'

export const runtime = 'nodejs'

/**
 * Persist a USER-role message. The assistant role is server-only — never accepted
 * from the client, which closes the AI message-impersonation hole.
 */
export const POST = defineHandler(
  {
    auth: 'session',
    body: userSavedMessageSchema,
    maxBodyBytes: 16 * 1024,
    rateLimit: { key: ({ userId, ip }) => `chat-msg:${userId ?? ip}`, limit: 30, windowSec: 60 },
  },
  async ({ session, body }) => {
    if (!(await verifyChatOwnership(body.chatId, session.user.id))) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    const message = await saveMessage(body.chatId, 'user', stripHtml(body.content))
    checkAndAwardChatBadges(session.user.id).catch(() => undefined)
    return NextResponse.json({ message }, { status: 201 })
  },
)

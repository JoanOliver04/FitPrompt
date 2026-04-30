/**
 * lib/chat.ts — Chat service layer
 *
 * Single source of truth for all chat/message operations.
 * Swap the DB calls here when migrating to a different backend.
 */

import { db } from '@/lib/db'
import { truncate } from '@/lib/utils'
import type { Chat } from '@/types'

// ─── Internal types ────────────────────────────────────────────────────────────

/** Message shape used when building the AI context window (may include system role). */
export interface StoredMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** Chat row enriched with last-message preview and count, for the list view. */
export type ChatSummary = Pick<Chat, 'id' | 'title' | 'createdAt' | 'updatedAt'> & {
  messageCount: number
  lastMessage: string | null
}

/** Chat row with its full visible message history (no system messages). */
export interface ChatDetail {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
  }>
}

// ─── Chat CRUD ────────────────────────────────────────────────────────────────

export async function createChat(
  userId: string,
  title = 'Nueva conversación',
): Promise<{ id: string; title: string; createdAt: Date; updatedAt: Date }> {
  return db.chat.create({
    data: { userId, title },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
}

export async function countUserChats(userId: string): Promise<number> {
  return db.chat.count({ where: { userId } })
}

export async function getUserChats(userId: string): Promise<ChatSummary[]> {
  const rows = await db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
      messages: {
        where: { role: { not: 'system' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true },
      },
    },
  })

  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c._count.messages,
    lastMessage: c.messages[0]?.content ?? null,
  }))
}

export async function getChatWithMessages(
  chatId: string,
  userId: string,
): Promise<ChatDetail | null> {
  const row = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        where: { role: { not: 'system' } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  })

  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messages: row.messages as ChatDetail['messages'],
  }
}

/** Lightweight ownership check — does not load messages. */
export async function verifyChatOwnership(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const row = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  })
  return row !== null
}

// ─── Message operations ───────────────────────────────────────────────────────

/** Returns full AI context window history (user + assistant only — system is stripped at write time). */
export async function getHistory(chatId: string): Promise<StoredMessage[]> {
  const rows = await db.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  })
  return rows as StoredMessage[]
}

/**
 * Persists one or more messages and bumps chat.updatedAt.
 * System-role messages are silently skipped.
 */
export async function saveMessages(chatId: string, ...msgs: StoredMessage[]): Promise<void> {
  const filtered = msgs.filter((m) => m.role !== 'system')
  if (!filtered.length) return

  await db.$transaction([
    db.message.createMany({
      data: filtered.map((m) => ({
        chatId,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    }),
    db.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
  ])
}

/** Persists a single message and returns the created row. */
export async function saveMessage(
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<{ id: string; chatId: string; role: string; content: string; createdAt: Date }> {
  const [message] = await db.$transaction([
    db.message.create({
      data: { chatId, role, content },
      select: { id: true, chatId: true, role: true, content: true, createdAt: true },
    }),
    db.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
  ])
  return message
}

// ─── Auto-title ───────────────────────────────────────────────────────────────

/**
 * Sets the chat title to the first 45 chars of the first user message.
 * Called automatically by the AI message route on the first exchange.
 */
export async function autoTitle(chatId: string, firstUserMessage: string): Promise<void> {
  const title = truncate(firstUserMessage.replace(/\n/g, ' ').trim(), 45)
  if (!title) return
  await db.chat.update({ where: { id: chatId }, data: { title } })
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

function todayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function getDailyCount(userId: string): Promise<number> {
  const record = await db.dailyMessageCount.findUnique({
    where: { userId_date: { userId, date: todayUTC() } },
  })
  return record?.count ?? 0
}

export async function incrementDailyCount(userId: string): Promise<number> {
  const record = await db.dailyMessageCount.upsert({
    where: { userId_date: { userId, date: todayUTC() } },
    update: { count: { increment: 1 } },
    create: { userId, date: todayUTC(), count: 1 },
  })
  return record.count
}

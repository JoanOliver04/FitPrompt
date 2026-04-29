import { db } from '@/lib/db'

export interface StoredMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function todayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function getHistory(chatId: string): Promise<StoredMessage[]> {
  const messages = await db.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  })
  return messages as StoredMessage[]
}

export async function pushMessages(chatId: string, ...msgs: StoredMessage[]): Promise<void> {
  await db.message.createMany({
    data: msgs
      .filter(m => m.role !== 'system')
      .map(m => ({
        chatId,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
  })
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

// In-memory store for chat history and daily message counts.
// Phase 03: replace with Prisma (db.chat, db.message).

export interface StoredMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const histories = new Map<string, StoredMessage[]>()
const dailyCounts = new Map<string, number>() // key: `${userId}::${YYYY-MM-DD}`

function todayKey(userId: string): string {
  return `${userId}::${new Date().toISOString().slice(0, 10)}`
}

export function getHistory(chatId: string): StoredMessage[] {
  return histories.get(chatId) ?? []
}

export function pushMessages(chatId: string, ...msgs: StoredMessage[]): void {
  const prev = histories.get(chatId) ?? []
  histories.set(chatId, [...prev, ...msgs])
}

export function getDailyCount(userId: string): number {
  return dailyCounts.get(todayKey(userId)) ?? 0
}

export function incrementDailyCount(userId: string): number {
  const key = todayKey(userId)
  const next = (dailyCounts.get(key) ?? 0) + 1
  dailyCounts.set(key, next)
  return next
}

import { db } from '@/lib/db'
import { WEEKLY_CHALLENGES, getWeekStart } from '@/lib/challenges'

function getWeekEnd(): Date {
  const end = new Date(getWeekStart())
  end.setDate(end.getDate() + 7)
  return end
}

export async function getChallengeProgress(userId: string, challengeId: string): Promise<number> {
  const def = WEEKLY_CHALLENGES.find(c => c.id === challengeId)
  if (!def) return 0

  const weekStart = getWeekStart()
  const weekEnd   = getWeekEnd()

  switch (def.type) {
    case 'workout_days': {
      const logs = await db.workoutLog.findMany({
        where:  { userId, date: { gte: weekStart, lt: weekEnd } },
        select: { date: true },
      })
      return new Set(logs.map(l => l.date.toISOString().split('T')[0])).size
    }
    case 'weight_days': {
      const logs = await db.weightLog.findMany({
        where:  { userId, date: { gte: weekStart, lt: weekEnd } },
        select: { date: true },
      })
      return new Set(logs.map(l => l.date.toISOString().split('T')[0])).size
    }
    case 'workout_complete': {
      return db.workoutLog.count({
        where: { userId, completed: true, date: { gte: weekStart, lt: weekEnd } },
      })
    }
    case 'volume_kg': {
      const exs = await db.workoutExercise.findMany({
        where:  { userId, date: { gte: weekStart, lt: weekEnd }, weight: { gt: 0 } },
        select: { sets: true, reps: true, weight: true },
      })
      return Math.round(exs.reduce((s, e) => s + e.sets * e.reps * e.weight, 0))
    }
    case 'chat_messages': {
      const chats = await db.chat.findMany({ where: { userId }, select: { id: true } })
      if (!chats.length) return 0
      return db.message.count({
        where: { chatId: { in: chats.map(c => c.id) }, role: 'user', createdAt: { gte: weekStart, lt: weekEnd } },
      })
    }
  }
}

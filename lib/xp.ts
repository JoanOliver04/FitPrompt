import { db } from '@/lib/db'

// ─── Constants ────────────────────────────────────────────────────────────────

/** XP granted per action. Add new entries here to support future rewards. */
export const XP_REWARDS = {
  WORKOUT_COMPLETE: 50,
  WEIGHT_LOG:       10,
  WEEK_COMPLETE:    200,
} as const

export const XP_PER_LEVEL = 1000

const LEVEL_NAMES = ['Novato', 'Activo', 'Consistente', 'Atleta', 'Beast', 'Elite']

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export interface LevelInfo {
  level:     number
  levelName: string
  current:   number
  max:       number
}

/** Derives level, levelName and progress bar values from a raw XP total. */
export function deriveLevel(totalXP: number): LevelInfo {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  return {
    level,
    levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    current:   totalXP % XP_PER_LEVEL,
    max:       XP_PER_LEVEL,
  }
}

// ─── DB operations ────────────────────────────────────────────────────────────

/** Adds `amount` XP to the user, creating the record on first call. */
export async function addXP(userId: string, amount: number): Promise<void> {
  await db.userXP.upsert({
    where:  { userId },
    create: { userId, totalXP: amount },
    update: { totalXP: { increment: amount } },
  })
}

/** Returns the user's current XP and derived level info. */
export async function getXP(userId: string): Promise<{ totalXP: number } & LevelInfo> {
  const record  = await db.userXP.findUnique({ where: { userId } })
  const totalXP = record?.totalXP ?? 0
  return { totalXP, ...deriveLevel(totalXP) }
}

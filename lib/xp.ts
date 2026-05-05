import { db } from '@/lib/db'

// ─── Constants ────────────────────────────────────────────────────────────────

/** XP granted per action. Add new entries here to support future rewards. */
export const XP_REWARDS = {
  WORKOUT_COMPLETE: 50,
  WEIGHT_LOG:       10,
  WEEK_COMPLETE:    200,
} as const

// XP required to reach each level (index = levelIndex, value = threshold)
export const LEVEL_THRESHOLDS = [0, 300, 700, 1500, 3000, 6000, 12000, 24000, 48000, 96000] as const

const LEVEL_NAMES = ['Novato', 'Activo', 'Consistente', 'Atleta', 'Guerrero', 'Élite', 'Culturista', 'Olimpia', 'Hulk', 'Superman'] as const

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export interface LevelInfo {
  level:     number
  levelName: string
  current:   number
  max:       number
}

/** Derives level, levelName and progress bar values from a raw XP total. */
export function deriveLevel(totalXP: number): LevelInfo {
  let levelIndex = LEVEL_THRESHOLDS.length - 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP < LEVEL_THRESHOLDS[i]) { levelIndex = i - 1; break }
  }

  const threshold     = LEVEL_THRESHOLDS[levelIndex]
  const isMax         = levelIndex === LEVEL_THRESHOLDS.length - 1
  const nextThreshold = isMax ? threshold + 1000 : LEVEL_THRESHOLDS[levelIndex + 1]

  return {
    level:     levelIndex + 1,
    levelName: LEVEL_NAMES[levelIndex],
    current:   totalXP - threshold,
    max:       nextThreshold - threshold,
  }
}

// ─── Level-up detection ───────────────────────────────────────────────────────

export interface LevelUpInfo {
  from:      number
  to:        number
  levelName: string
}

// ─── DB operations ────────────────────────────────────────────────────────────

/**
 * Adds `amount` XP to the user. Returns level-up info when the action caused
 * the user to cross a level threshold, or null otherwise.
 */
export async function addXP(userId: string, amount: number): Promise<LevelUpInfo | null> {
  const before    = await db.userXP.findUnique({ where: { userId }, select: { totalXP: true } })
  const prevXP    = before?.totalXP ?? 0
  const prevLevel = deriveLevel(prevXP).level

  await db.userXP.upsert({
    where:  { userId },
    create: { userId, totalXP: amount },
    update: { totalXP: { increment: amount } },
  })

  const newInfo = deriveLevel(prevXP + amount)
  if (newInfo.level > prevLevel) {
    return { from: prevLevel, to: newInfo.level, levelName: newInfo.levelName }
  }
  return null
}

/** Returns the user's current XP and derived level info. */
export async function getXP(userId: string): Promise<{ totalXP: number } & LevelInfo> {
  const record  = await db.userXP.findUnique({ where: { userId } })
  const totalXP = record?.totalXP ?? 0
  return { totalXP, ...deriveLevel(totalXP) }
}

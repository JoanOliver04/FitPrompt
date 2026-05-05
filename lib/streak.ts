import { db } from '@/lib/db'
import { addXP, XP_REWARDS } from '@/lib/xp'
import { awardBadge } from '@/lib/badges'
import { BadgeId } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number
  bestStreak:    number
  weekComplete:  boolean
}

// ─── ISO week helpers ─────────────────────────────────────────────────────────

// Returns "YYYY-Www" for the ISO week containing `date`
function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Thursday of the current week determines the ISO year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const year    = d.getFullYear()
  const jan4    = new Date(year, 0, 4)
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

// Returns the ISO week string for the week immediately before `isoWeek`
function prevISOWeek(isoWeek: string): string {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year    = parseInt(yearStr, 10)
  const week    = parseInt(weekStr, 10)
  // Monday of ISO week 1
  const jan4    = new Date(year, 0, 4)
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  // Monday of target week (week - 1, i.e. delta = week - 2 from week1)
  const targetMon = new Date(week1Mon)
  targetMon.setDate(week1Mon.getDate() + (week - 2) * 7)
  return getISOWeek(targetMon)
}

function getMondayOfWeek(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function getSundayOfWeek(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(monday.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

// ─── Read — called from getDashboardData ──────────────────────────────────────

// Reads the streak record, resets currentStreak to 0 if a week was skipped,
// and returns current/best streak plus whether the current week is already complete.
export async function resolveStreak(
  userId:      string,
  daysPerWeek: number,
): Promise<StreakData> {
  const now         = new Date()
  const currentWeek = getISOWeek(now)
  const monday      = getMondayOfWeek(now)
  const sunday      = getSundayOfWeek(monday)

  const [streak, completedThisWeek] = await Promise.all([
    db.streak.findUnique({ where: { userId } }),
    db.workoutLog.count({
      where: { userId, completed: true, date: { gte: monday, lte: sunday } },
    }),
  ])

  const weekComplete = completedThisWeek >= daysPerWeek

  // Streak is broken when lastCompletedWeek is neither the current nor the
  // previous week (user skipped an entire week without completing it)
  if (streak?.currentStreak && streak.lastCompletedWeek) {
    const prev    = prevISOWeek(currentWeek)
    const isStale =
      streak.lastCompletedWeek !== currentWeek &&
      streak.lastCompletedWeek !== prev
    if (isStale) {
      await db.streak.update({ where: { userId }, data: { currentStreak: 0 } })
      return { currentStreak: 0, bestStreak: streak.bestStreak, weekComplete }
    }
  }

  return {
    currentStreak: streak?.currentStreak ?? 0,
    bestStreak:    streak?.bestStreak    ?? 0,
    weekComplete,
  }
}

// ─── Write — called from workout API after a completed workout is saved ───────

// Checks if the user has now completed all planned workouts for the current
// week. If yes, increments currentStreak (or starts a new one) and updates
// bestStreak. Idempotent: re-calling for the same week is a no-op.
export async function updateStreakIfWeekComplete(
  userId:      string,
  daysPerWeek: number,
): Promise<void> {
  const now         = new Date()
  const currentWeek = getISOWeek(now)
  const monday      = getMondayOfWeek(now)
  const sunday      = getSundayOfWeek(monday)

  const completedThisWeek = await db.workoutLog.count({
    where: { userId, completed: true, date: { gte: monday, lte: sunday } },
  })

  if (completedThisWeek < daysPerWeek) return // week not yet complete

  const streak = await db.streak.findUnique({ where: { userId } })

  if (streak?.lastCompletedWeek === currentWeek) return // already counted this week

  const prev       = prevISOWeek(currentWeek)
  const newCurrent = streak?.lastCompletedWeek === prev
    ? (streak.currentStreak + 1)
    : 1
  const newBest = Math.max(newCurrent, streak?.bestStreak ?? 0)

  await Promise.all([
    db.streak.upsert({
      where:  { userId },
      update: { currentStreak: newCurrent, bestStreak: newBest, lastCompletedWeek: currentWeek },
      create: { userId, currentStreak: newCurrent, bestStreak: newBest, lastCompletedWeek: currentWeek },
    }),
    addXP(userId, XP_REWARDS.WEEK_COMPLETE),
    awardBadge(userId, BadgeId.week_1), // idempotent — only fires once
  ])
}

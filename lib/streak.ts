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

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const year    = d.getFullYear()
  const jan4    = new Date(year, 0, 4)
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

function prevISOWeek(isoWeek: string): string {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year    = parseInt(yearStr, 10)
  const week    = parseInt(weekStr, 10)
  const jan4    = new Date(year, 0, 4)
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
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

export async function resolveStreak(userId: string): Promise<StreakData> {
  const now         = new Date()
  const currentWeek = getISOWeek(now)
  const monday      = getMondayOfWeek(now)
  const sunday      = getSundayOfWeek(monday)
  const prev        = prevISOWeek(currentWeek)

  const [streak, completedThisWeek] = await Promise.all([
    db.streak.findUnique({ where: { userId } }),
    db.workoutLog.count({
      where: { userId, completed: true, date: { gte: monday, lte: sunday } },
    }),
  ])

  const weekComplete = completedThisWeek >= 1

  // ── Week done but not yet recorded → self-heal ────────────────────────────
  if (weekComplete && streak?.lastCompletedWeek !== currentWeek) {
    const newCurrent = streak?.lastCompletedWeek === prev
      ? (streak.currentStreak + 1)
      : 1
    const newBest = Math.max(newCurrent, streak?.bestStreak ?? 0)
    await db.streak.upsert({
      where:  { userId },
      update: { currentStreak: newCurrent, bestStreak: newBest, lastCompletedWeek: currentWeek },
      create: { userId, currentStreak: newCurrent, bestStreak: newBest, lastCompletedWeek: currentWeek },
    })
    return { currentStreak: newCurrent, bestStreak: newBest, weekComplete: true }
  }

  // ── Already recorded this week ────────────────────────────────────────────
  if (weekComplete && streak?.lastCompletedWeek === currentWeek) {
    return { currentStreak: streak.currentStreak, bestStreak: streak.bestStreak, weekComplete: true }
  }

  // ── New week, not trained yet — preserve streak if last week was completed ─
  if (!weekComplete && streak?.lastCompletedWeek === prev) {
    // Streak is still alive; fix DB if it was incorrectly zeroed
    const display = Math.max(streak.currentStreak, 1)
    if (streak.currentStreak === 0) {
      await db.streak.update({ where: { userId }, data: { currentStreak: 1 } })
    }
    return { currentStreak: display, bestStreak: streak.bestStreak, weekComplete: false }
  }

  // ── Streak broken: gap of 2+ weeks without training ───────────────────────
  if (streak && streak.currentStreak > 0 && streak.lastCompletedWeek &&
      streak.lastCompletedWeek !== currentWeek && streak.lastCompletedWeek !== prev) {
    await db.streak.update({ where: { userId }, data: { currentStreak: 0 } })
    return { currentStreak: 0, bestStreak: streak.bestStreak, weekComplete: false }
  }

  return {
    currentStreak: streak?.currentStreak ?? 0,
    bestStreak:    streak?.bestStreak    ?? 0,
    weekComplete,
  }
}

// ─── Write — called from workout API after a completed workout is saved ───────

export async function updateStreakIfWeekComplete(userId: string): Promise<void> {
  const now         = new Date()
  const currentWeek = getISOWeek(now)
  const monday      = getMondayOfWeek(now)
  const sunday      = getSundayOfWeek(monday)

  const completedThisWeek = await db.workoutLog.count({
    where: { userId, completed: true, date: { gte: monday, lte: sunday } },
  })

  if (completedThisWeek < 1) return

  const streak = await db.streak.findUnique({ where: { userId } })

  if (streak?.lastCompletedWeek === currentWeek) return

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
    awardBadge(userId, BadgeId.week_1),
  ])
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDailyCount, countUserChats } from '@/lib/chat'
import type { Plan, Role } from '@/types'

// ─── Plan configuration ───────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    dailyMessages: 5,
    maxChats: 3,
  },
  premium: {
    dailyMessages: Infinity,
    maxChats: Infinity,
  },
} as const satisfies Record<Plan, { dailyMessages: number; maxChats: number }>

export const PREMIUM_FEATURES = {
  social_groups: 'Grupos sociales',
  progress_charts: 'Gráficas de progreso',
  advanced_badges: 'Todos los badges',
} as const

export type PremiumFeature = keyof typeof PREMIUM_FEATURES

// ─── Result types ─────────────────────────────────────────────────────────────

export interface LimitAllowed {
  allowed: true
  remaining?: number
}

export interface LimitBlocked {
  allowed: false
  status: 403 | 429
  /** Human-readable description of why the action was blocked. */
  message: string
  /** Machine-readable code for frontend branching (e.g. show upgrade modal). */
  code: 'DAILY_MESSAGE_LIMIT' | 'CHAT_LIMIT' | 'PREMIUM_REQUIRED'
}

export type LimitResult = LimitAllowed | LimitBlocked

// ─── Plan resolver ────────────────────────────────────────────────────────────

/**
 * Reads the plan directly from DB.
 * Use when the JWT token may be stale (e.g. right after a plan upgrade).
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const row = await db.user.findUnique({ where: { id: userId }, select: { plan: true } })
  return (row?.plan ?? 'free') as Plan
}

// ─── Individual checks ────────────────────────────────────────────────────────

export async function checkMessageLimit(userId: string, plan: Plan): Promise<LimitResult> {
  const limit = PLAN_LIMITS[plan].dailyMessages
  if (!isFinite(limit)) return { allowed: true }

  const used = await getDailyCount(userId)
  if (used >= limit) {
    return {
      allowed: false,
      status: 429,
      message: `Has alcanzado el límite de ${limit} mensajes diarios del plan Free. Se restablece a medianoche (UTC).`,
      code: 'DAILY_MESSAGE_LIMIT',
    }
  }

  return { allowed: true, remaining: limit - used }
}

export async function checkChatLimit(userId: string, plan: Plan): Promise<LimitResult> {
  const limit = PLAN_LIMITS[plan].maxChats
  if (!isFinite(limit)) return { allowed: true }

  const count = await countUserChats(userId)
  if (count >= limit) {
    return {
      allowed: false,
      status: 403,
      message: `Has alcanzado el límite de ${limit} chats del plan Free.`,
      code: 'CHAT_LIMIT',
    }
  }

  return { allowed: true, remaining: limit - count }
}

export function requirePremium(plan: Plan, feature: PremiumFeature): LimitResult {
  if (plan === 'premium') return { allowed: true }

  return {
    allowed: false,
    status: 403,
    message: `${PREMIUM_FEATURES[feature]} está disponible únicamente en el plan Premium.`,
    code: 'PREMIUM_REQUIRED',
  }
}

// ─── Central check function ───────────────────────────────────────────────────

export type LimitOperation =
  | { type: 'send_message' }
  | { type: 'create_chat' }
  | { type: 'premium_feature'; feature: PremiumFeature }

/**
 * Single entry point for all plan-based limits.
 *
 * The `plan` is taken from the JWT session. If the user recently upgraded and
 * the token hasn't refreshed yet, pass `await getUserPlan(user.id)` as the plan
 * for post-upgrade accuracy.
 */
export async function checkUserLimits(
  user: { id: string; plan: Plan; role?: Role },
  operation: LimitOperation,
): Promise<LimitResult> {
  if (user.role === 'ADMIN') return { allowed: true }

  switch (operation.type) {
    case 'send_message':
      return checkMessageLimit(user.id, user.plan)
    case 'create_chat':
      return checkChatLimit(user.id, user.plan)
    case 'premium_feature':
      return requirePremium(user.plan, operation.feature)
  }
}

// ─── Middleware helper ────────────────────────────────────────────────────────

/**
 * Middleware-style gate for API routes.
 *
 * Returns null when the action is allowed, or a ready-to-return NextResponse
 * when it is blocked. Designed for a single-line check at the top of a handler:
 *
 *   const blocked = await applyLimits(user, { type: 'send_message' })
 *   if (blocked) return blocked
 */
export async function applyLimits(
  user: { id: string; plan: Plan; role?: Role },
  operation: LimitOperation,
): Promise<NextResponse | null> {
  const result = await checkUserLimits(user, operation)
  if (!result.allowed) return limitBlockedResponse(result)
  return null
}

// ─── Response serializer ─────────────────────────────────────────────────────

export function limitBlockedResponse(result: LimitBlocked): NextResponse {
  return NextResponse.json(
    {
      error: 'Limit reached',
      message: result.message,
      upgrade: true,
      code: result.code,
    },
    { status: result.status },
  )
}

// ─── UI utility ──────────────────────────────────────────────────────────────

/**
 * Returns how many messages the user has left today, or null for unlimited plans.
 * Avoid calling this if you already read the count earlier in the same request.
 */
export async function getMessagesRemaining(userId: string, plan: Plan): Promise<number | null> {
  const limit = PLAN_LIMITS[plan].dailyMessages
  if (!isFinite(limit)) return null
  const used = await getDailyCount(userId)
  return Math.max(0, limit - used)
}

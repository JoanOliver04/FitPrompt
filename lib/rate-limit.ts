import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface RateLimitOpts {
  key: string
  limit: number
  windowSec: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: Date
}

/**
 * Atomic fixed-window counter backed by Postgres.
 * Single upsert — race-safe via the (key, windowStart) unique index.
 *
 * NOTE: this is intentionally simple and shared between routes. For very high
 * traffic move to @upstash/ratelimit (Redis) keeping the same interface.
 */
export async function rateLimit(opts: RateLimitOpts): Promise<RateLimitResult> {
  const { key, limit, windowSec } = opts
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000)
  const resetAt = new Date(windowStart.getTime() + windowSec * 1000)

  try {
    const row = await db.rateLimit.upsert({
      where:  { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    })
    const ok = row.count <= limit
    if (!ok) logger.security('rate_limit_hit', { key, count: row.count, limit })
    return { ok, remaining: Math.max(0, limit - row.count), resetAt }
  } catch (err) {
    // Fail-open on storage errors so legit users are not locked out; log loudly.
    logger.error('rate_limit_storage_failure', { key, err })
    return { ok: true, remaining: limit, resetAt }
  }
}

/** Convenience: derive a per-IP key from the request. */
export function ipFrom(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

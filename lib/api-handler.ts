import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, type Session } from 'next-auth'
import { ZodError, type ZodTypeAny, type z } from 'zod'
import crypto from 'node:crypto'
import { authOptions } from '@/lib/auth'
import { applyLimits, type LimitOperation } from '@/lib/limits'
import { rateLimit, ipFrom } from '@/lib/rate-limit'
import { readJson, PayloadTooLargeError, InvalidContentTypeError } from '@/lib/http'
import { logger } from '@/lib/logger'
import type { Plan, Role } from '@/types'

export interface AuthedSession {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    plan: Plan
    role: Role
  }
}

export interface HandlerContext<TParams, TBody> {
  req:       NextRequest
  params:    TParams
  body:      TBody
  session:   AuthedSession
  ip:        string
  requestId: string
}

interface HandlerConfig<S extends ZodTypeAny | undefined, P> {
  /** session: requires login. admin: requires ADMIN role. public: no check (rare). */
  auth?: 'session' | 'admin' | 'public'
  /** Zod schema for the JSON body. */
  body?: S
  /** Parser for the dynamic route params. Receives the resolved Next.js params. */
  params?: (raw: Record<string, string>) => P
  /** Optional rate limit. The key receives ip + userId. */
  rateLimit?: {
    key:       (ctx: { ip: string; userId: string | null }) => string
    limit:     number
    windowSec: number
  }
  /** Plan-tier limit (uses lib/limits.ts). */
  planLimit?: LimitOperation
  /** Hard cap for the request body in bytes. Default 64 KB. */
  maxBodyBytes?: number
}

type BodyType<S extends ZodTypeAny | undefined> = S extends ZodTypeAny ? z.infer<S> : undefined

type Handler<P, B> = (ctx: HandlerContext<P, B>) => Promise<NextResponse> | NextResponse

type RouteCtx = { params: Promise<Record<string, string>> }

export function defineHandler<
  S extends ZodTypeAny | undefined = undefined,
  P = Record<string, string>,
>(
  cfg: HandlerConfig<S, P>,
  handler: Handler<P, BodyType<S>>,
): (req: NextRequest, ctx: RouteCtx) => Promise<NextResponse> {
  return async (req: NextRequest, ctx: RouteCtx): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()
    const ip = ipFrom(req)

    try {
      // ── 1. Authentication ──────────────────────────────────────────────────
      let session: Session | null = null
      if (cfg.auth !== 'public') {
        session = await getServerSession(authOptions)
        if (!session?.user?.id) {
          return jsonResp({ error: 'Unauthorized' }, 401, requestId)
        }
        if (cfg.auth === 'admin' && session.user.role !== 'ADMIN') {
          logger.security('forbidden_admin', { requestId, userId: session.user.id, ip, path: req.nextUrl.pathname })
          return jsonResp({ error: 'Forbidden' }, 403, requestId)
        }
      }

      // ── 2. Rate limit ───────────────────────────────────────────────────────
      if (cfg.rateLimit) {
        const key = cfg.rateLimit.key({ ip, userId: session?.user?.id ?? null })
        const r = await rateLimit({ key, limit: cfg.rateLimit.limit, windowSec: cfg.rateLimit.windowSec })
        if (!r.ok) {
          return jsonResp({ error: 'Too many requests' }, 429, requestId, {
            'Retry-After': String(Math.max(1, Math.ceil((r.resetAt.getTime() - Date.now()) / 1000))),
          })
        }
      }

      // ── 3. Plan-tier limit ──────────────────────────────────────────────────
      if (cfg.planLimit && session) {
        const blocked = await applyLimits(
          {
            id:   session.user.id,
            plan: (session.user as { plan?: Plan }).plan ?? 'free',
            role: session.user.role as Role,
          },
          cfg.planLimit,
        )
        if (blocked) return blocked
      }

      // ── 4. Body validation ──────────────────────────────────────────────────
      let body: unknown = undefined
      if (cfg.body && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
        body = await readJson<unknown>(req, cfg.maxBodyBytes ?? 64 * 1024)
        const parsed = cfg.body.safeParse(body)
        if (!parsed.success) {
          return jsonResp({ error: 'Validation failed', issues: parsed.error.issues }, 422, requestId)
        }
        body = parsed.data
      }

      // ── 5. Params ───────────────────────────────────────────────────────────
      const rawParams = await ctx.params
      const params = (cfg.params ? cfg.params(rawParams) : rawParams) as P

      // ── 6. Handler ─────────────────────────────────────────────────────────
      const authed: AuthedSession = session
        ? {
            user: {
              id:    session.user.id,
              email: session.user.email ?? '',
              name:  session.user.name ?? null,
              image: session.user.image ?? null,
              plan:  ((session.user as { plan?: Plan }).plan ?? 'free') as Plan,
              role:  (session.user.role as Role) ?? 'USER',
            },
          }
        : ({ user: { id: '', email: '', name: null, image: null, plan: 'free', role: 'USER' } } as AuthedSession)

      const res = await handler({
        req,
        params,
        body: body as BodyType<S>,
        session: authed,
        ip,
        requestId,
      })

      res.headers.set('X-Request-Id', requestId)
      // Authenticated JSON is never cacheable by intermediaries
      if (!res.headers.has('Cache-Control')) {
        res.headers.set('Cache-Control', 'no-store')
      }
      return res
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        return jsonResp({ error: 'Payload too large' }, 413, requestId)
      }
      if (err instanceof InvalidContentTypeError) {
        return jsonResp({ error: err.message }, 415, requestId)
      }
      if (err instanceof SyntaxError) {
        return jsonResp({ error: 'Invalid JSON body' }, 400, requestId)
      }
      if (err instanceof ZodError) {
        return jsonResp({ error: 'Validation failed', issues: err.issues }, 422, requestId)
      }
      logger.error('handler_uncaught', { requestId, ip, path: req.nextUrl.pathname, err })
      return jsonResp({ error: 'Internal Server Error', requestId }, 500, requestId)
    }
  }
}

function jsonResp(
  body: unknown,
  status: number,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

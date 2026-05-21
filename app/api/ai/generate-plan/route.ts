import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { generatePlan } from '@/lib/ai'
import { loadAIProfile } from '@/lib/ai-profile'
import { userProfileSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import type { UserProfile } from '@/types'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    body: userProfileSchema,
    rateLimit: {
      key: ({ userId, ip }) => `ai-plan:${userId ?? ip}`,
      limit: 5,
      windowSec: 60 * 60,
    },
    planLimit: { type: 'send_message' },
    maxBodyBytes: 8 * 1024,
  },
  async ({ session, body }) => {
    // Always prefer the persisted profile to prevent client tampering with macros.
    // loadAIProfile also overrides `weight` with the latest WeightLog entry.
    const stored = await loadAIProfile(session.user.id)
    const profile: UserProfile = stored ?? ({
      ...body,
      userId:     session.user.id,
      birthDate:  body.birthDate instanceof Date ? body.birthDate : new Date(body.birthDate),
    } as unknown as UserProfile)

    try {
      const result = await generatePlan(profile)
      return NextResponse.json(result)
    } catch (err) {
      logger.error('ai_generate_plan_failed', {
        userId: session.user.id,
        err: err instanceof Error ? err.message : String(err),
      })
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
    }
  },
)

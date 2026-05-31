import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { personalRecordSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export const GET = defineHandler(
  { auth: 'session' },
  async ({ session }) => {
    const records = await db.userPersonalRecord.findMany({
      where:   { userId: session.user.id },
      select:  { exercise: true, mode: true, weight: true, reps: true, updatedAt: true },
    })
    return NextResponse.json({ records })
  },
)

export const PUT = defineHandler(
  {
    auth: 'session',
    body: personalRecordSchema,
    maxBodyBytes: 1024,
    rateLimit: { key: ({ userId }) => `pr:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, body }) => {
    const { exercise, mode, weight } = body
    // 1rep is a single-rep PR by definition — clamp server-side so the UI
    // can't sneak in higher reps for the max-load ranking.
    const reps = mode === '1rep' ? 1 : body.reps

    const record = await db.userPersonalRecord.upsert({
      where:  { userId_exercise_mode: { userId: session.user.id, exercise, mode } },
      update: { weight, reps },
      create: { userId: session.user.id, exercise, mode, weight, reps },
      select: { exercise: true, mode: true, weight: true, reps: true, updatedAt: true },
    })
    return NextResponse.json({ record })
  },
)

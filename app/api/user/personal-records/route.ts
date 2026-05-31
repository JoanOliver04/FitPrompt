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
      select:  { exercise: true, weight: true, reps: true, updatedAt: true },
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
    const { exercise, weight, reps } = body
    const record = await db.userPersonalRecord.upsert({
      where:  { userId_exercise: { userId: session.user.id, exercise } },
      update: { weight, reps },
      create: { userId: session.user.id, exercise, weight, reps },
      select: { exercise: true, weight: true, reps: true, updatedAt: true },
    })
    return NextResponse.json({ record })
  },
)

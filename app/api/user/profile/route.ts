import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { userProfilePatchSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export const PUT = defineHandler(
  {
    auth: 'session',
    body: userProfilePatchSchema,
    maxBodyBytes: 8 * 1024,
    rateLimit: { key: ({ userId }) => `profile:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, body }) => {
    const { name, username, birthDate, ...profile } = body
    const profileKeys = Object.keys(profile)
    const needsProfileWrite = profileKeys.length > 0 || birthDate !== undefined

    if (needsProfileWrite) {
      const existing = await db.userProfile.findUnique({
        where: { userId: session.user.id }, select: { id: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Complete onboarding first' }, { status: 409 })
      }
    }

    if (username !== undefined) {
      const taken = await db.user.findUnique({
        where: { username }, select: { id: true },
      })
      if (taken && taken.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username taken', issues: [{ path: ['username'], message: 'Ese nombre de usuario ya está en uso' }] },
          { status: 409 },
        )
      }
    }

    await db.$transaction(async (tx) => {
      if (name !== undefined || username !== undefined) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            ...(name     !== undefined && { name }),
            ...(username !== undefined && { username }),
          },
        })
      }
      if (needsProfileWrite) {
        await tx.userProfile.update({
          where: { userId: session.user.id },
          data: {
            ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
            ...profile,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  },
)

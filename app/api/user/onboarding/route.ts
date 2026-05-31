import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { awardBadge } from '@/lib/badges'
import { BadgeId } from '@prisma/client'
import { onboardingSchema } from '@/lib/schemas'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    body: onboardingSchema,
    maxBodyBytes: 16 * 1024,
    rateLimit: { key: ({ userId }) => `onboarding:${userId}`, limit: 10, windowSec: 60 * 60 },
  },
  async ({ session, body }) => {
    const birthDate = new Date(body.birthDate)
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ error: 'Invalid birthDate' }, { status: 422 })
    }

    const data = {
      birthDate,
      weight:          body.weight,
      height:          body.height,
      gender:          body.gender,
      goal:            body.goal,
      level:           body.level,
      daysPerWeek:     body.daysPerWeek,
      sessionTime:     body.sessionTime,
      workoutType:     body.workoutType,
      schedule:        body.schedule,
      injuries:        body.injuries ?? null,
      allergies:       body.allergies ?? null,
      foodPreferences: body.foodPreferences ?? [],
      extraInfo:       body.extraInfo ?? null,
    }

    // Only set username if the user doesn't already have one (Google flow).
    // Existing users can't reassign their handle here; that belongs to settings.
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    })
    const userUpdate: { name: string; isPublic: boolean; username?: string } = {
      name: body.name,
      isPublic: body.isPublic ?? true,
    }
    if (body.username && !currentUser?.username) {
      const taken = await db.user.findUnique({
        where: { username: body.username },
        select: { id: true },
      })
      if (taken && taken.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Username taken', issues: [{ path: ['username'], message: 'Ese nombre de usuario ya está en uso' }] },
          { status: 409 },
        )
      }
      userUpdate.username = body.username
    }

    await db.$transaction([
      db.user.update({ where: { id: session.user.id }, data: userUpdate }),
      db.userProfile.upsert({
        where:  { userId: session.user.id },
        update: data,
        create: { userId: session.user.id, ...data },
      }),
    ])

    awardBadge(session.user.id, BadgeId.first_step).catch(() => undefined)

    return NextResponse.json({ success: true })
  },
)

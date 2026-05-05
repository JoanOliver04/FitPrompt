import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { awardBadge } from '@/lib/badges'
import { BadgeId } from '@prisma/client'
import type { UserProfile } from '@/types'

type OnboardingBody = Omit<UserProfile, 'userId'> & { name: string }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: OnboardingBody
  try {
    body = (await req.json()) as OnboardingBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userId = session.user.id

  await db.userProfile.upsert({
    where: { userId },
    update: {
      age: body.age,
      weight: body.weight,
      height: body.height,
      gender: body.gender,
      goal: body.goal,
      level: body.level,
      daysPerWeek: body.daysPerWeek,
      sessionTime: body.sessionTime,
      workoutType: body.workoutType,
      schedule: body.schedule,
      injuries: body.injuries ?? null,
      allergies: body.allergies ?? null,
      foodPreferences: body.foodPreferences ?? [],
      extraInfo: body.extraInfo ?? null,
    },
    create: {
      userId,
      age: body.age,
      weight: body.weight,
      height: body.height,
      gender: body.gender,
      goal: body.goal,
      level: body.level,
      daysPerWeek: body.daysPerWeek,
      sessionTime: body.sessionTime,
      workoutType: body.workoutType,
      schedule: body.schedule,
      injuries: body.injuries ?? null,
      allergies: body.allergies ?? null,
      foodPreferences: body.foodPreferences ?? [],
      extraInfo: body.extraInfo ?? null,
    },
  })

  awardBadge(userId, BadgeId.first_step).catch(() => undefined)

  return NextResponse.json({ success: true })
}

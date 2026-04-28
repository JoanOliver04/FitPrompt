import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

  const profile: UserProfile = {
    userId: session.user.id,
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
    injuries: body.injuries,
    allergies: body.allergies,
    foodPreferences: body.foodPreferences ?? [],
    extraInfo: body.extraInfo,
  }

  // TODO (Phase 03): persist via Prisma
  // await db.userProfile.upsert({
  //   where:  { userId: profile.userId },
  //   update: profile,
  //   create: profile,
  // })

  return NextResponse.json({ success: true, profile })
}

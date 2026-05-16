import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    name?: string
    birthDate?: string
    weight?: number
    height?: number
    goal?: string
    level?: string
    daysPerWeek?: number
    workoutType?: string
  }

  const { name, birthDate, ...profileFields } = body

  await Promise.all([
    name !== undefined
      ? db.user.update({ where: { id: session.user.id }, data: { name } })
      : Promise.resolve(),

    Object.keys(profileFields).length > 0 || birthDate !== undefined
      ? db.userProfile.upsert({
          where: { userId: session.user.id },
          create: {
            userId:      session.user.id,
            birthDate:   birthDate ? new Date(birthDate) : new Date(),
            weight:      profileFields.weight      ?? 70,
            height:      profileFields.height      ?? 170,
            gender:      'male',
            goal:        (profileFields.goal       ?? 'maintenance') as never,
            level:       (profileFields.level      ?? 'beginner')    as never,
            daysPerWeek: profileFields.daysPerWeek ?? 3,
            sessionTime: '45-60',
            workoutType: (profileFields.workoutType ?? 'gym')        as never,
            schedule:    'morning',
          },
          update: {
            ...(birthDate   !== undefined && { birthDate: new Date(birthDate) }),
            ...(profileFields.weight      !== undefined && { weight:      profileFields.weight }),
            ...(profileFields.height      !== undefined && { height:      profileFields.height }),
            ...(profileFields.goal        !== undefined && { goal:        profileFields.goal        as never }),
            ...(profileFields.level       !== undefined && { level:       profileFields.level       as never }),
            ...(profileFields.daysPerWeek !== undefined && { daysPerWeek: profileFields.daysPerWeek }),
            ...(profileFields.workoutType !== undefined && { workoutType: profileFields.workoutType as never }),
          },
        })
      : Promise.resolve(),
  ])

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { GOAL_LABELS, LEVEL_LABELS, WORKOUT_LABELS, type ExerciseDay } from '@/lib/pdf-parser'
import { renderFitPlanDocument } from '@/components/pdf/FitPlanDocument'

interface Params { params: Promise<{ id: string }> }

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [routine, user] = await Promise.all([
    db.routine.findUnique({
      where:   { id },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    db.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, email: true, profile: true },
    }),
  ])

  if (!routine || routine.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const exerciseDays: ExerciseDay[] = routine.days.map((d) => ({
    name: `Día ${d.dayIndex + 1} — ${d.name}`,
    exercises: d.exercises.map((ex) => ({
      name:     ex.name,
      setsReps: `${ex.sets} × ${ex.reps}`,
      rest:     ex.restSeconds ? `${ex.restSeconds} seg` : '',
      notes:    '',
    })),
  }))

  const profile      = user?.profile ?? null
  const goalLabel    = GOAL_LABELS[profile?.goal ?? '']    ?? ''
  const levelLabel   = LEVEL_LABELS[profile?.level ?? '']  ?? ''
  const workoutLabel = WORKOUT_LABELS[profile?.workoutType ?? ''] ?? ''

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderFitPlanDocument({
      chatTitle:    routine.name,
      userName:     user?.name ?? user?.email ?? 'Usuario',
      exportDate:   new Date(),
      profile:      profile
        ? {
            goal:        profile.goal,
            level:       profile.level,
            workoutType: profile.workoutType,
            daysPerWeek: profile.daysPerWeek,
          }
        : null,
      exerciseDays,
      meals:        [],
      goalLabel,
      levelLabel,
      workoutLabel,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    console.error('[routine-pdf]', message)
    return NextResponse.json({ error: 'Error generando el PDF.' }, { status: 500 })
  }

  const safeName = routine.name.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40) || 'rutina'
  const filename = `fitprompt-${safeName}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}

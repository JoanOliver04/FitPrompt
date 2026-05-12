import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChatWithMessages, verifyChatOwnership } from '@/lib/chat'
import { db } from '@/lib/db'
import {
  extractPlanSections,
  parseExerciseDays,
  parseMeals,
  GOAL_LABELS,
  LEVEL_LABELS,
  WORKOUT_LABELS,
} from '@/lib/pdf-parser'
import { renderFitPlanDocument } from '@/components/pdf/FitPlanDocument'

interface Params {
  params: Promise<{ chatId: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatId } = await params
  const userId = session.user.id

  const owns = await verifyChatOwnership(chatId, userId)
  if (!owns) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  // ── Data fetching ────────────────────────────────────────────────────────────
  const [chat, user] = await Promise.all([
    getChatWithMessages(chatId, userId),
    db.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true, profile: true },
    }),
  ])

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  // ── Parse plan from chat messages ────────────────────────────────────────────
  const { rutina, dieta, found } = extractPlanSections(chat.messages)

  if (!found) {
    return NextResponse.json(
      {
        error:
          'Este chat no contiene un plan de entrenamiento. Genera un plan con FitCoach primero.',
      },
      { status: 422 },
    )
  }

  const exerciseDays = parseExerciseDays(rutina)
  const meals        = parseMeals(dieta)

  // ── Resolve profile labels ───────────────────────────────────────────────────
  const profile     = user?.profile ?? null
  const goalLabel   = GOAL_LABELS[profile?.goal   ?? ''] ?? ''
  const levelLabel  = LEVEL_LABELS[profile?.level  ?? ''] ?? ''
  const workoutLabel= WORKOUT_LABELS[profile?.workoutType ?? ''] ?? ''

  // ── Render PDF ───────────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderFitPlanDocument({
      chatTitle:    chat.title,
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
      meals,
      goalLabel,
      levelLabel,
      workoutLabel,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    console.error('[export-pdf]', message)
    return NextResponse.json({ error: 'Error generando el PDF.' }, { status: 500 })
  }

  // ── Response ─────────────────────────────────────────────────────────────────
  const filename = `fitprompt-plan-${chatId.slice(0, 8)}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyChatOwnership } from '@/lib/chat'
import { parseDietDays, hasDietStructure } from '@/lib/pdf-parser'
import { renderDietPdfDocument } from '@/components/pdf/DietPdfDocument'

interface Params { params: Promise<{ chatId: string }> }

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId } = await params
  const userId = session.user.id

  const owns = await verifyChatOwnership(chatId, userId)
  if (!owns) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  const messageId = req.nextUrl.searchParams.get('messageId') ?? undefined

  // Resolve the source message: either the explicit one, or the latest
  // assistant message in this chat that looks like a diet.
  let content: string | null = null
  if (messageId) {
    const msg = await db.message.findFirst({
      where:  { id: messageId, chatId, role: 'assistant' },
      select: { content: true },
    })
    content = msg?.content ?? null
  } else {
    const rows = await db.message.findMany({
      where:   { chatId, role: 'assistant' },
      orderBy: { createdAt: 'desc' },
      take:    20,
      select:  { content: true },
    })
    content = rows.find((r) => hasDietStructure(r.content))?.content ?? null
  }

  if (!content || !hasDietStructure(content)) {
    return NextResponse.json(
      { error: 'No se detectó una dieta en este mensaje.' },
      { status: 422 },
    )
  }

  const days = parseDietDays(content)
  if (days.length === 0) {
    return NextResponse.json(
      { error: 'No se pudo parsear la dieta del mensaje.' },
      { status: 422 },
    )
  }

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true, profile: true },
  })

  const profile = user?.profile ?? null
  const macroTarget = profile
    ? buildMacroTarget(profile)
    : null

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderDietPdfDocument({
      userName:    user?.name ?? user?.email ?? 'Usuario',
      exportDate:  new Date(),
      days,
      macroTarget,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    console.error('[diet-pdf]', message)
    return NextResponse.json({ error: 'Error generando el PDF.' }, { status: 500 })
  }

  const filename = `fitprompt-dieta-${chatId.slice(0, 8)}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}

// Compact Mifflin-St Jeor + activity + goal-delta — duplicates the lib/prompts
// math intentionally so we can render the targets without pulling in the full
// prompt module (which carries a server-only sanitizer).
function buildMacroTarget(p: {
  weight: number; height: number; gender: string; goal: string; daysPerWeek: number; birthDate: Date
}): { calories: number; protein: number; carbs: number; fat: number } {
  const age = Math.max(
    13,
    Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 86400 * 1000)),
  )
  const base = 10 * p.weight + 6.25 * p.height - 5 * age
  const bmr =
    p.gender === 'male'   ? Math.round(base + 5)
    : p.gender === 'female' ? Math.round(base - 161)
    : Math.round(base - 78)

  const mult =
    p.daysPerWeek <= 2 ? 1.375
    : p.daysPerWeek <= 4 ? 1.55
    : p.daysPerWeek <= 6 ? 1.725
    : 1.9
  const tdee = Math.round(bmr * mult)

  const delta: Record<string, number> = {
    volume: 300, definition: -400, weight_loss: -600, maintenance: 0,
  }
  const proteinPerKg: Record<string, number> = {
    volume: 2.1, definition: 2.3, weight_loss: 2.0, maintenance: 1.8,
  }
  const calories = Math.max(1200, tdee + (delta[p.goal] ?? 0))
  const protein  = Math.round(p.weight * (proteinPerKg[p.goal] ?? 1.8))
  const fat      = Math.round((calories * 0.28) / 9)
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { calories, protein, carbs, fat }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getHistory,
  saveMessages,
  getDailyCount,
  incrementDailyCount,
  autoTitle,
  verifyChatOwnership,
} from '@/lib/chat'
import type { Plan } from '@/types'

const FREE_DAILY_LIMIT = 5
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const FITCOACH_SYSTEM = `Eres FitCoach, entrenador personal y nutricionista deportivo de élite con 15 años de experiencia.
Respondes en español. Eres motivador, preciso y pedagógico.
Cuando el usuario pregunte sobre rutinas, nutrición, técnica o progreso, das respuestas concretas y personalizadas.
Usas Markdown (negrita, listas) para estructurar. Emojis con moderación (💪 🥗 🔥).
Nunca inventes datos médicos. Si hay riesgo para la salud, recomienda consultar a un profesional.`

interface GroqResponse {
  choices: Array<{ message: { content: string } }>
}

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return MOCK_REPLY

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 1024 }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[Groq] ${res.status}:`, body)
    throw new Error(`Groq ${res.status}: ${body}`)
  }

  const data: GroqResponse = await res.json()
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')
  return content
}

interface Params {
  params: Promise<{ chatId: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatId } = await params
  const userId = session.user.id
  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  // Verify the chat belongs to this user
  const owns = await verifyChatOwnership(chatId, userId)
  if (!owns) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  // Enforce daily message limit for free plan
  if (plan === 'free') {
    const count = await getDailyCount(userId)
    if (count >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el límite de mensajes diarios del plan Free.',
          upgradeUrl: '/settings',
        },
        { status: 429 },
      )
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const content = (body as Record<string, unknown>)?.content
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'content must be a non-empty string' }, { status: 400 })
  }

  const userMessage = { role: 'user' as const, content: content.trim() }
  const history = await getHistory(chatId)
  const isFirstMessage = history.length === 0

  const messages = [
    { role: 'system' as const, content: FITCOACH_SYSTEM },
    ...history,
    userMessage,
  ]

  let aiContent: string
  try {
    aiContent = await callGroq(messages)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI service error'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Persist messages and bump updatedAt in one transaction
  await saveMessages(chatId, userMessage, { role: 'assistant', content: aiContent })

  // Auto-title from first user message
  if (isFirstMessage) {
    await autoTitle(chatId, userMessage.content)
  }

  const messagesUsed = await incrementDailyCount(userId)

  return NextResponse.json({
    content: aiContent,
    ...(plan === 'free' && { messagesLeft: Math.max(0, FREE_DAILY_LIMIT - messagesUsed) }),
  })
}

const MOCK_REPLY =
  'Soy FitCoach en modo demo — la clave de Groq no está configurada en este entorno. ' +
  'Cuando añadas `GROQ_API_KEY` al `.env.local`, responderé con inteligencia artificial real. 🤖'

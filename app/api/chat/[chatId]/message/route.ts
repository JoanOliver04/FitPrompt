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
import { generarPromptListaCompra } from '@/lib/prompts'
import { getLastCheckIn } from '@/lib/checkin'
import { db } from '@/lib/db'
import type { Plan, UserProfile, ShoppingList } from '@/types'
import { SHOPPING_LIST_SENTINEL } from '@/types'

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

async function callGroq(
  messages: { role: string; content: string }[],
  temperature = 0.7,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return MOCK_REPLY

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, temperature, max_tokens: 1024 }),
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

// ─── Shopping list ────────────────────────────────────────────────────────────

const SHOPPING_LIST_TRIGGERS = [
  /lista\s+de\s+(?:la\s+)?compra/i,
  /qu[eé]\s+(?:necesito\s+)?comprar/i,
  /ingredientes?\s+(?:para\s+)?comprar/i,
  /compra\s+(?:semanal|para\s+la\s+semana)/i,
  /hacer\s+la\s+compra/i,
]

function isShoppingListRequest(content: string): boolean {
  const normalized = content.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return SHOPPING_LIST_TRIGGERS.some((re) => re.test(normalized))
}

function parseShoppingList(raw: string): Omit<ShoppingList, 'summary'> | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) return null
    return parsed as Omit<ShoppingList, 'summary'>
  } catch {
    return null
  }
}

function shoppingListToMarkdown(list: Omit<ShoppingList, 'summary'>): string {
  return (
    '## 🛒 Lista de la Compra\n\n' +
    list.categories
      .map(
        (cat) =>
          `### ${cat.emoji} ${cat.name}\n${cat.items.map((i) => `- ${i.name}${i.amount ? ` (${i.amount})` : ''}`).join('\n')}`,
      )
      .join('\n\n')
  )
}

/** Strip shopping list sentinel before passing messages to the AI — keeps context clean. */
function sanitizeForGroq(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: string; content: string }> {
  return messages.map((m) => {
    if (m.content.startsWith(SHOPPING_LIST_SENTINEL)) {
      try {
        const data = JSON.parse(m.content.slice(SHOPPING_LIST_SENTINEL.length)) as ShoppingList
        return { ...m, content: data.summary }
      } catch {
        return m
      }
    }
    return m
  })
}

// ─── Route ────────────────────────────────────────────────────────────────────

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

  const owns = await verifyChatOwnership(chatId, userId)
  if (!owns) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

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

  // ─── Shopping list intent ─────────────────────────────────────────────────

  if (isShoppingListRequest(userMessage.content)) {
    let parsedList: Omit<ShoppingList, 'summary'> | null = null

    if (!process.env.GROQ_API_KEY) {
      // Demo mode: return a sample list so the feature is fully testable without an API key
      parsedList = parseShoppingList(MOCK_SHOPPING_JSON)
    } else {
      const userRow = await db.user.findUnique({
        where: { id: userId },
        select: { profile: true },
      })

      if (userRow?.profile) {
        const profile = userRow.profile as unknown as UserProfile
        try {
          const rawAI = await callGroq(
            [
              { role: 'system', content: generarPromptListaCompra(profile) },
              { role: 'user', content: '¡Genera la lista!' },
            ],
            0.2,
          )
          parsedList = parseShoppingList(rawAI)
        } catch {
          // fall through to normal AI flow
        }
      }
    }

    if (parsedList) {
      const summary = shoppingListToMarkdown(parsedList)
      const aiContent = SHOPPING_LIST_SENTINEL + JSON.stringify({ ...parsedList, summary })

      await saveMessages(chatId, userMessage, { role: 'assistant', content: aiContent })
      if (isFirstMessage) await autoTitle(chatId, userMessage.content)
      const messagesUsed = await incrementDailyCount(userId)

      return NextResponse.json({
        content: aiContent,
        ...(plan === 'free' && { messagesLeft: Math.max(0, FREE_DAILY_LIMIT - messagesUsed) }),
      })
    }
  }

  // ─── Normal AI flow ───────────────────────────────────────────────────────

  const lastCheckIn = await getLastCheckIn(userId)
  const checkInContext = lastCheckIn
    ? `\n\n---\n\n**Último check-in del usuario** (semana del ${lastCheckIn.weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}):\n> "${lastCheckIn.response}"\n\nTen en cuenta este contexto para personalizar tus respuestas.`
    : ''

  const messages = [
    { role: 'system' as const, content: FITCOACH_SYSTEM + checkInContext },
    ...sanitizeForGroq(history),
    userMessage,
  ]

  let aiContent: string
  try {
    aiContent = await callGroq(messages)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI service error'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  await saveMessages(chatId, userMessage, { role: 'assistant', content: aiContent })

  if (isFirstMessage) {
    await autoTitle(chatId, userMessage.content)
  }

  const messagesUsed = await incrementDailyCount(userId)

  return NextResponse.json({
    content: aiContent,
    ...(plan === 'free' && { messagesLeft: Math.max(0, FREE_DAILY_LIMIT - messagesUsed) }),
  })
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REPLY =
  'Soy FitCoach en modo demo — la clave de Groq no está configurada en este entorno. ' +
  'Cuando añadas `GROQ_API_KEY` al `.env.local`, responderé con inteligencia artificial real. 🤖'

const MOCK_SHOPPING_JSON = JSON.stringify({
  categories: [
    {
      name: 'Proteínas',
      emoji: '🥩',
      items: [
        { name: 'Pechuga de pollo', amount: '800g' },
        { name: 'Huevos camperos', amount: '12 uds' },
        { name: 'Salmón fresco', amount: '400g' },
        { name: 'Requesón desnatado', amount: '500g' },
        { name: 'Atún al natural', amount: '4 latas' },
      ],
    },
    {
      name: 'Carbohidratos',
      emoji: '🌾',
      items: [
        { name: 'Arroz integral', amount: '1kg' },
        { name: 'Avena en copos', amount: '500g' },
        { name: 'Pan integral', amount: '1 barra' },
        { name: 'Boniato', amount: '600g' },
        { name: 'Quinoa', amount: '400g' },
      ],
    },
    {
      name: 'Verduras',
      emoji: '🥦',
      items: [
        { name: 'Brócoli', amount: '500g' },
        { name: 'Espinacas baby', amount: '300g' },
        { name: 'Tomate cherry', amount: '400g' },
        { name: 'Pimiento rojo', amount: '3 uds' },
        { name: 'Calabacín', amount: '2 uds' },
      ],
    },
    {
      name: 'Frutas',
      emoji: '🍎',
      items: [
        { name: 'Plátanos', amount: '6 uds' },
        { name: 'Manzanas', amount: '4 uds' },
        { name: 'Arándanos', amount: '200g' },
        { name: 'Naranja', amount: '4 uds' },
      ],
    },
    {
      name: 'Otros',
      emoji: '🛒',
      items: [
        { name: 'Aceite de oliva virgen extra', amount: '500ml' },
        { name: 'Frutos secos (mix)', amount: '200g' },
        { name: 'Yogur griego natural', amount: '4 uds' },
        { name: 'Proteína en polvo (whey)', amount: '1 bote' },
      ],
    },
  ],
})

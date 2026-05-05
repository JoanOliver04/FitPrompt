import { db } from '@/lib/db'

// ─── Week helpers ─────────────────────────────────────────────────────────────

/** Returns the Monday (UTC) of the week containing `date`. */
function getWeekStart(date = new Date()): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCurrentWeekCheckIn(userId: string) {
  const weekStart = getWeekStart()
  return db.weeklyCheckIn.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  })
}

export async function needsCheckIn(userId: string): Promise<boolean> {
  return (await getCurrentWeekCheckIn(userId)) === null
}

export async function saveCheckIn(userId: string, response: string) {
  const weekStart = getWeekStart()
  return db.weeklyCheckIn.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, response },
    update: { response },
  })
}

export async function updateCheckInSuggestions(id: string, suggestions: string[]) {
  return db.weeklyCheckIn.update({
    where: { id },
    data: { aiSuggestions: JSON.stringify(suggestions) },
  })
}

/** Returns the most recent check-in for the user — used to inject context into chat. */
export async function getLastCheckIn(userId: string) {
  return db.weeklyCheckIn.findFirst({
    where: { userId },
    orderBy: { weekStart: 'desc' },
    select: { response: true, weekStart: true },
  })
}

// ─── AI suggestions ───────────────────────────────────────────────────────────

interface GroqResponse {
  choices: Array<{ message: { content: string } }>
}

/**
 * Calls Groq to produce 3 personalised suggestions based on the user's check-in text.
 * Falls back to static suggestions when GROQ_API_KEY is absent or the call fails.
 */
export async function generateSuggestions(response: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return FALLBACK_SUGGESTIONS

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres FitCoach, entrenador personal experto. El usuario ha hecho su check-in semanal. ' +
              'Genera exactamente 3 sugerencias motivadoras y concretas para mejorar la próxima semana. ' +
              'Responde ÚNICAMENTE con un array JSON de 3 strings. Sin bloques de código, sin texto adicional. ' +
              'Ejemplo: ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]',
          },
          { role: 'user', content: response },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)

    const data = (await res.json()) as GroqResponse
    const content = data.choices[0]?.message?.content ?? ''
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return FALLBACK_SUGGESTIONS

    const parsed = JSON.parse(match[0]) as unknown[]
    const suggestions = parsed.filter((s): s is string => typeof s === 'string').slice(0, 3)
    return suggestions.length > 0 ? suggestions : FALLBACK_SUGGESTIONS
  } catch {
    return FALLBACK_SUGGESTIONS
  }
}

const FALLBACK_SUGGESTIONS: string[] = [
  'Mantén la constancia — cada semana suma a tu progreso total.',
  'Revisa tu nutrición post-entreno: la proteína en los primeros 30 minutos acelera la recuperación.',
  'Añade 5 minutos de movilidad al final de cada sesión para mejorar el rango de movimiento.',
]

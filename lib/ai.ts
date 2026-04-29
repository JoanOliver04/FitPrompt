import { generarSystemPrompt, generarPromptCombinado } from '@/lib/prompts'
import type { UserProfile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratePlanResult {
  rutina: string
  dieta: string
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices: Array<{ message: { content: string } }>
}

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(messages: GroqMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return MOCK_PLAN
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq ${res.status}: ${body}`)
  }

  const data: GroqResponse = await res.json()
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')
  return content
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parsePlanSections(fullPlan: string): GeneratePlanResult {
  const parte1 = fullPlan.match(/## PARTE 1[\s\S]*?(?=## PARTE 2|$)/)?.[0]?.trim()
  const parte2 = fullPlan.match(/## PARTE 2[\s\S]*?(?=## PARTE 3|$)/)?.[0]?.trim()
  return {
    rutina: parte1 ?? fullPlan,
    dieta: parte2 ?? fullPlan,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePlan(profile: UserProfile): Promise<GeneratePlanResult> {
  const fullPlan = await callGroq([
    { role: 'system', content: generarSystemPrompt(profile) },
    { role: 'user', content: generarPromptCombinado(profile) },
  ])
  return parsePlanSections(fullPlan)
}

// ─── Mock (dev fallback when GROQ_API_KEY is not set) ─────────────────────────

const MOCK_PLAN = `## PARTE 1 — PLAN DE ENTRENAMIENTO 💪

### 📅 Día 1 — Push | Pecho · Hombros · Tríceps

#### 🔥 Calentamiento (5 min)
- Rotaciones de hombro: 10 reps cada lado
- Flexiones de pecho abiertas: 10 reps

#### 💪 Bloque principal

| # | Ejercicio | Series × Reps | Carga | Descanso | Notas |
|---|-----------|---------------|-------|----------|-------|
| 1 | Press banca plano | 4 × 8–10 | 75% 1RM | 90 seg | Escápulas retraídas |
| 2 | Press inclinado mancuernas | 3 × 10–12 | 70% 1RM | 75 seg | Codos a 45° |
| 3 | Elevaciones laterales | 3 × 12–15 | Ligero | 60 seg | Sin impulso |
| 4 | Fondos en paralelas | 3 × 10 | Peso corporal | 75 seg | Torso vertical |
| 5 | Press francés | 3 × 12 | 65% 1RM | 60 seg | Codos fijos |

#### 🧘 Vuelta a la calma (3 min)
- Estiramiento pectoral en pared: 30 seg cada lado
- Estiramiento tríceps overhead: 30 seg cada lado

---

## PARTE 2 — PLAN DE NUTRICIÓN 🥗

### 🥗 Plan de Alimentación Diario

**Total del día**: 2 400 kcal | Proteína: 180g | Carbos: 240g | Grasa: 70g

---

#### 🕗 07:30 — Desayuno

**Plato**: Tortilla de claras con avena

| Ingrediente | Cantidad | Proteína (g) | Carbos (g) | Grasa (g) | kcal |
|-------------|----------|-------------|-----------|-----------|------|
| Claras de huevo | 200 g | 22 | 0 | 0 | 92 |
| Avena | 80 g | 10 | 54 | 6 | 290 |
| Plátano | 100 g | 1 | 23 | 0 | 96 |
| **Total** | | **33g** | **77g** | **6g** | **478 kcal** |

💡 *Prepara la avena la noche anterior (overnight oats) para ahorrar tiempo.*

---

#### 📊 Resumen del día

| Métrica | Real | Objetivo | Diferencia |
|---------|------|----------|------------|
| Calorías | 2 390 kcal | 2 400 kcal | −10 |
| Proteína | 180g | 180g | 0g |
| Carbohidratos | 238g | 240g | −2g |
| Grasa | 71g | 70g | +1g |
`

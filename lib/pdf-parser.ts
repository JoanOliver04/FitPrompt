/**
 * lib/pdf-parser.ts
 *
 * Utilities for extracting and parsing structured workout/diet data
 * from the AI-generated markdown stored in chat messages.
 *
 * Expected message format (from lib/prompts.ts — generarPromptCombinado):
 *   ## PARTE 1 — PLAN DE ENTRENAMIENTO  (sections split by ## PARTE N)
 *   ## PARTE 2 — PLAN DE NUTRICIÓN
 */

// ─── Label maps ───────────────────────────────────────────────────────────────

export const GOAL_LABELS: Record<string, string> = {
  volume:      'Ganar masa muscular',
  definition:  'Definición muscular',
  weight_loss: 'Pérdida de peso',
  maintenance: 'Mantenimiento',
}

export const LEVEL_LABELS: Record<string, string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

export const WORKOUT_LABELS: Record<string, string> = {
  gym:        'Gimnasio',
  home:       'Casa',
  bodyweight: 'Calistenia',
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Strip markdown syntax and emojis for plain-text PDF rendering. */
export function cleanText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold → plain
    .replace(/\*(.*?)\*/g, '$1')        // italic → plain
    .replace(/[*_`]/g, '')
    // Remove emoji ranges
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[☀-➿]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Parse rows of a single markdown table block (excludes header and separator). */
function parseTableRows(block: string): string[][] {
  const rows: string[][] = []
  let pastSeparator = false

  for (const line of block.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue

    // Separator row ( |---|---| )
    if (/^\|[\s\-:|]+\|/.test(trimmed)) {
      pastSeparator = true
      continue
    }

    if (!pastSeparator) continue   // skip header row

    const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length >= 2) rows.push(cells)
  }

  return rows
}

// ─── Plan extraction ──────────────────────────────────────────────────────────

/**
 * Finds the assistant message that contains the structured plan
 * and splits it into PARTE 1 (rutina) and PARTE 2 (dieta).
 */
export function extractPlanSections(
  messages: Array<{ role: string; content: string }>,
): { rutina: string; dieta: string; found: boolean } {
  const candidate = messages
    .filter((m) => m.role === 'assistant' && m.content.includes('PARTE 1'))
    .sort((a, b) => b.content.length - a.content.length)[0]

  if (!candidate) {
    return { rutina: '', dieta: '', found: false }
  }

  const text = candidate.content
  const rutina = text.match(/## PARTE 1[\s\S]*?(?=## PARTE 2|$)/)?.[0]?.trim() ?? ''
  const dieta  = text.match(/## PARTE 2[\s\S]*?(?=## PARTE 3|$)/)?.[0]?.trim() ?? ''

  return { rutina, dieta, found: true }
}

// ─── Exercise parsing ─────────────────────────────────────────────────────────

export interface ExerciseRow {
  name:     string
  setsReps: string   // "4 × 8–10"
  rest:     string   // "90 seg"
  notes:    string
}

export interface ExerciseDay {
  name:      string          // "Día 1 — Push · Pecho · Hombros · Tríceps"
  exercises: ExerciseRow[]
}

/**
 * Parses PARTE 1 markdown into structured exercise days.
 *
 * Splits on day headers  (## 📅 Día N  or  ### 📅 Día N)
 * and extracts exercise tables from the "Bloque principal" section of each day.
 */
export function parseExerciseDays(rutina: string): ExerciseDay[] {
  if (!rutina) return []

  const days: ExerciseDay[] = []

  // Split on every day header
  const dayBlocks = rutina.split(/(?=#{2,3}\s*📅?\s*Día\s+\d+)/i)

  for (const block of dayBlocks) {
    const nameMatch = block.match(/#{2,3}\s*📅?\s*(Día\s+\d+[^\n]*)/i)
    if (!nameMatch) continue

    const dayName = cleanText(nameMatch[1]).replace(/\|/g, '·')

    // Focus on the main block (after "Bloque principal" if present)
    const mainSection = block.includes('Bloque principal')
      ? (block.split(/Bloque principal/i)[1] ?? block)
      : block

    const rows = parseTableRows(mainSection)
    const exercises: ExerciseRow[] = []

    for (const row of rows) {
      // Detect whether the first column is the row number (#)
      const numbered = /^\d+$/.test(row[0] ?? '')
      const o = numbered ? 1 : 0          // column offset

      const name = cleanText(row[o] ?? '')
      if (!name || /^[#]?ejercicio/i.test(name)) continue

      exercises.push({
        name,
        setsReps: cleanText(row[o + 1] ?? ''),
        // column layout: name | series×reps | carga | descanso | notas
        rest:     cleanText(row[o + 3] ?? row[o + 2] ?? ''),
        notes:    cleanText(row[o + 4] ?? row[o + 3] ?? ''),
      })
    }

    if (exercises.length > 0) {
      days.push({ name: dayName, exercises })
    }
  }

  return days
}

// ─── Meal parsing ─────────────────────────────────────────────────────────────

export interface Meal {
  name:  string   // "Desayuno", "Almuerzo", "Cena" …
  time:  string   // "07:30" (may be empty)
  plate: string   // "Tortilla de claras con avena"
  kcal:  string   // "478 kcal" (may be empty)
}

// ─── Weekly diet parsing ──────────────────────────────────────────────────────

export interface DietDay {
  name:  string   // "Día 1 — Lunes"
  meals: Meal[]
}

/**
 * Heuristic check used by chat UI to decide whether to show the "Descargar
 * dieta en PDF" button on an assistant message.
 */
export function hasDietStructure(content: string): boolean {
  // Matches "## 🥗 Día N" or "## 🥗 Plan de Alimentación"
  return /##[^\n]{0,25}🥗/.test(content) ||
         /##\s*Plan de Alimentaci/i.test(content) ||
         /####\s*🕗?\s*\d{1,2}:\d{2}\s*—\s*(?:Desayuno|Almuerzo|Comida|Cena|Pre-entreno|Post-entreno|Merienda)/i.test(content)
}

/**
 * Parses a weekly diet markdown into an array of days. If no day-level headers
 * are present (e.g. single-day diet), returns a single "day" with all meals.
 */
export function parseDietDays(dieta: string): DietDay[] {
  if (!dieta) return []

  // Try splitting by "## 🥗 Día N — Lunes/Martes/..." headers first.
  const dayRegex = /##[^\n]{0,15}D[ií]a\s+\d+\s*[—\-:][^\n]+/g
  const dayMatches = [...dieta.matchAll(dayRegex)]

  if (dayMatches.length === 0) {
    // Single-day diet: treat the whole text as one block.
    const meals = parseMeals(dieta)
    return meals.length > 0 ? [{ name: 'Plan diario', meals }] : []
  }

  const days: DietDay[] = []
  for (let i = 0; i < dayMatches.length; i++) {
    const start = dayMatches[i].index!
    const end   = dayMatches[i + 1]?.index ?? dieta.length
    const block = dieta.slice(start, end)

    const name  = cleanText(dayMatches[i][0].replace(/^##\s*/, ''))
    const meals = parseMeals(block)
    if (meals.length > 0) days.push({ name, meals })
  }

  return days
}

/**
 * Extracts every ingredient row out of a weekly diet markdown so the shopping-
 * list generator can ask the AI to base its categories on real foods the user
 * is already eating. Quantities are kept as strings ("150 g", "2 unidades").
 */
export interface DietIngredient {
  name:     string
  quantity: string
}

export function parseDietIngredients(dieta: string): DietIngredient[] {
  if (!dieta) return []
  const found: DietIngredient[] = []
  const seen  = new Set<string>()

  for (const line of dieta.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    // Skip header/separator/total rows
    if (/^\|[\s\-:|]+\|/.test(trimmed)) continue
    const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean)
    if (cells.length < 2) continue
    const name  = cleanText(cells[0])
    const qty   = cleanText(cells[1])
    if (!name) continue
    // Drop header rows ("Ingrediente"), totals, and macro rows
    if (/^ingrediente$/i.test(name)) continue
    if (/total/i.test(name)) continue
    if (/^(prote|carbo|grasa|kcal)/i.test(name)) continue
    // Drop rows where the first cell is clearly numeric (macro table from "Resumen")
    if (/^\d/.test(name)) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    found.push({ name, quantity: qty })
  }

  return found
}

// ─── Meal parsing ─────────────────────────────────────────────────────────────

/**
 * Parses PARTE 2 markdown into structured meal cards.
 *
 * Splits on meal-time headers:
 *   #### 🕗 07:30 — Desayuno
 *   #### Desayuno
 */
export function parseMeals(dieta: string): Meal[] {
  if (!dieta) return []

  const meals: Meal[] = []

  // Split on each meal-level heading
  const mealBlocks = dieta.split(
    /(?=####\s*🕗?\s*\d{1,2}:\d{2}\s*—|####\s*(?:Desayuno|Almuerzo|Comida|Merienda|Cena|Pre-entreno|Post-entreno|Snack))/i,
  )

  for (const block of mealBlocks) {
    const headerMatch = block.match(
      /####\s*🕗?\s*(\d{1,2}:\d{2})?\s*—?\s*([^\n]+)/,
    )
    if (!headerMatch) continue

    const time  = headerMatch[1] ?? ''
    const name  = cleanText(headerMatch[2])
    if (!name) continue

    const plateMatch = block.match(/\*\*Plato\*\*:\s*([^\n]+)/)
    const plate = plateMatch ? cleanText(plateMatch[1]) : ''

    // Extract kcal from the "Total" row of the ingredient table
    // e.g.  | **Total** | | **33g** | **77g** | **6g** | **478 kcal** |
    const kcalMatch =
      block.match(/Total[^\|]*\|(?:[^\|]*\|){0,6}[^\|]*?(\d[\d\s,.]+)\s*kcal/i) ??
      block.match(/(\d[\d\s,.]+)\s*kcal/i)

    const kcal = kcalMatch ? `${kcalMatch[1].replace(/\s/g, '')} kcal` : ''

    meals.push({ name, time, plate, kcal })
  }

  return meals
}

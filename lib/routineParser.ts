export interface ParsedExercise {
  order:       number
  name:        string
  sets:        number
  reps:        string
  restSeconds: number | null
}

export interface ParsedDay {
  dayIndex:  number
  name:      string
  exercises: ParsedExercise[]
}

export interface ParsedRoutine {
  name: string
  days: ParsedDay[]
}

/**
 * Tries to parse a structured workout routine from a markdown AI response.
 * Returns null if no recognizable day structure is found.
 */
export function parseRoutineFromMarkdown(content: string, fallbackName?: string): ParsedRoutine | null {
  // Match "## Día X —" or "## 📅 Día X —" or "## 💪 Día X:" etc. (any emoji/prefix up to 25 chars)
  const dayRegex = /#{2,3}[^\n]{0,25}[Dd][íi]a\s+(\d+)\s*[—\-:]\s*([^\n]+)/g
  const dayMatches = [...content.matchAll(dayRegex)]

  if (dayMatches.length === 0) return null

  const days: ParsedDay[] = dayMatches.map((match, i) => {
    const dayIndex = parseInt(match[1]) - 1
    // Remove anything after " | " (muscle groups) and clean emojis
    const rawName = match[2].replace(/\s*[|].*$/, '').trim()
    const dayName = rawName.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim() || `Día ${i + 1}`

    const sectionStart = match.index!
    const sectionEnd   = dayMatches[i + 1]?.index ?? content.length
    const section      = content.slice(sectionStart, sectionEnd)

    return { dayIndex, name: dayName, exercises: parseExerciseTable(section) }
  })

  const name =
    fallbackName ??
    `Rutina ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`

  return { name, days }
}

function parseExerciseTable(section: string): ParsedExercise[] {
  const exercises: ParsedExercise[] = []
  let order = 0

  const SKIP = /^(?:ejercicio|exercise|nombre|#|\-+|:[-|: ]+)/i

  // Pattern 1 (numbered): | N | Exercise | Sets × Reps | Carga | Rest | Notes |
  const numberedRow =
    /\|\s*\d+\s*\|\s*([^|]{2,}?)\s*\|\s*(\d+)\s*[×xXx×]\s*([\d][0-9–\-]*)\s*\|([^|]*)\|([^|]*)\|/g

  for (const m of section.matchAll(numberedRow)) {
    const name = m[1].trim()
    if (!name || SKIP.test(name)) continue
    const sets = parseInt(m[2])
    if (isNaN(sets) || sets < 1 || sets > 20) continue
    const reps = m[3].replace('–', '-').trim()
    const restText = (m[4] + ' ' + m[5]).toLowerCase()
    const restMatch = restText.match(/(\d+)\s*seg/)
    const restSeconds = restMatch ? parseInt(restMatch[1]) : null
    exercises.push({ order: order++, name, sets, reps, restSeconds })
  }

  if (exercises.length > 0) return exercises

  // Pattern 2 (no number): | Exercise | Sets × Reps | Rest | Notes |
  const plainRow =
    /\|\s*([A-Za-záéíóúüñÁÉÍÓÚÜÑ][^|]{1,50}?)\s*\|\s*(\d+)\s*[×xXx×]\s*([\d][0-9–\-]*)\s*\|([^|]*)\|/g

  for (const m of section.matchAll(plainRow)) {
    const name = m[1].trim()
    if (!name || SKIP.test(name)) continue
    const sets = parseInt(m[2])
    if (isNaN(sets) || sets < 1 || sets > 20) continue
    const reps = m[3].replace('–', '-').trim()
    const restMatch2 = m[4].toLowerCase().match(/(\d+)\s*seg/)
    const restSeconds = restMatch2 ? parseInt(restMatch2[1]) : null
    exercises.push({ order: order++, name, sets, reps, restSeconds })
  }

  return exercises
}

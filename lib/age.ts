/** Returns the age in full years from a birth date. */
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/** ISO date string (YYYY-MM-DD) → age in full years. Returns null if invalid. */
export function calculateAgeFromString(dateStr: string): number | null {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return calculateAge(d)
}

/** Min birth date allowed (user must be at most 100 years old). */
export function maxBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 13)
  return d.toISOString().split('T')[0]
}

/** Max birth date allowed (user must be at least 13 years old). */
export function minBirthDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 100)
  return d.toISOString().split('T')[0]
}

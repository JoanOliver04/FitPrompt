// lib/utils.ts — Helpers reutilizables

// ─── Clases CSS ────────────────────────────────────────────────────────────────

type ClassValue = string | number | boolean | null | undefined | ClassValue[]

/** Combina clases CSS de forma segura, filtrando valores falsy */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Fechas ────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, locale = 'es-ES'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return formatDate(d)
}

// ─── Strings ───────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/** Convierte un texto en un slug URL-friendly: "Hola Mundo!" → "hola-mundo" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ─── Números ───────────────────────────────────────────────────────────────────

/** Formatea un número con separadores de miles: 1234 → "1.234" */
export function formatNumber(n: number, locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale).format(n)
}

/** Limita un valor entre min y max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ─── Misc ──────────────────────────────────────────────────────────────────────

/** Genera un ID único basado en timestamp + aleatoriedad */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Devuelve una promesa que se resuelve tras `ms` milisegundos */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

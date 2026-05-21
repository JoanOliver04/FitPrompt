function av(emoji: string, bg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='${bg}'/><text x='50' y='70' font-size='56' text-anchor='middle'>${emoji}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const PREDEFINED_AVATARS = [
  av('🏋️', '#FF471A'),
  av('💪', '#e03d15'),
  av('🏃', '#22c55e'),
  av('🤸', '#3b82f6'),
  av('🧘', '#a855f7'),
  av('🚴', '#0ea5e9'),
  av('🏊', '#14b8a6'),
  av('🔥', '#ef4444'),
  av('⚡', '#eab308'),
  av('🏆', '#f59e0b'),
  av('🎯', '#ec4899'),
  av('⭐', '#6366f1'),
]

export const MAX_UPLOAD_BYTES = 300_000

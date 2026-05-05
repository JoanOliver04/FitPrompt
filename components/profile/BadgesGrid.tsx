import { db } from '@/lib/db'
import { BADGE_DEFINITIONS } from '@/lib/badges'

interface Props {
  userId: string
}

export async function BadgesGrid({ userId }: Props) {
  const achievements = await db.achievement.findMany({
    where:  { userId },
    select: { badge: true },
  })

  const unlocked = new Set(achievements.map(a => a.badge))

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {BADGE_DEFINITIONS.map((def) => {
        const earned = unlocked.has(def.id)
        return (
          <div
            key={def.id}
            title={earned ? def.description : 'Bloqueado'}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              earned
                ? 'bg-[#FF471A]/10 border border-[#FF471A]/30'
                : 'bg-[#1A1A1A] border border-[#2A2A2A] opacity-40'
            }`}
          >
            <span className={`text-3xl ${earned ? '' : 'grayscale'}`}>{def.icon}</span>
            <p className="text-xs text-center font-semibold text-text-primary leading-tight">
              {def.name}
            </p>
            <p className={`text-[10px] text-center leading-tight ${earned ? 'text-[#FF471A]' : 'text-text-muted'}`}>
              {earned ? def.description : '???'}
            </p>
          </div>
        )
      })}
    </div>
  )
}

import type { BadgeDefinition } from '@/lib/badges'

interface Props {
  definition: BadgeDefinition
  earned:     boolean
  earnedAt?:  Date | null
}

const COLOR_STYLES: Record<BadgeDefinition['color'], { card: string; text: string; dot: string }> = {
  orange: { card: 'bg-[#FF471A]/10 border-[#FF471A]/30 hover:border-[#FF471A]/60', text: 'text-[#FF471A]',  dot: 'bg-[#FF471A]'  },
  red:    { card: 'bg-red-500/10    border-red-500/25    hover:border-red-500/55',  text: 'text-red-400',   dot: 'bg-red-400'    },
  amber:  { card: 'bg-amber-500/10  border-amber-500/25  hover:border-amber-500/55',text: 'text-amber-400', dot: 'bg-amber-400'  },
  purple: { card: 'bg-purple-500/10 border-purple-500/25 hover:border-purple-500/55',text: 'text-purple-400',dot: 'bg-purple-400'},
  green:  { card: 'bg-green-500/10  border-green-500/25  hover:border-green-500/55',text: 'text-green-400', dot: 'bg-green-400'  },
  blue:   { card: 'bg-blue-500/10   border-blue-500/25   hover:border-blue-500/55', text: 'text-blue-400',  dot: 'bg-blue-400'   },
  teal:   { card: 'bg-teal-500/10   border-teal-500/25   hover:border-teal-500/55', text: 'text-teal-400',  dot: 'bg-teal-400'   },
}

export function BadgeCard({ definition, earned, earnedAt }: Props) {
  const dateLabel = earnedAt
    ? earnedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const style = COLOR_STYLES[definition.color]

  return (
    <div className="relative group">

      {/* Tooltip */}
      <div className={[
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-52',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none',
      ].join(' ')}>
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3 shadow-2xl">
          <p className="text-text-primary text-xs font-bold mb-1">{definition.name}</p>
          <p className="text-text-muted text-[11px] leading-relaxed">
            {earned ? definition.description : definition.hint}
          </p>
          {earned && dateLabel && (
            <p className={`${style.text} text-[10px] mt-2 font-semibold`}>
              Desbloqueado el {dateLabel}
            </p>
          )}
          {!earned && (
            <p className="text-text-muted text-[10px] mt-1.5 flex items-center gap-1">
              <span>🔒</span> Bloqueado
            </p>
          )}
        </div>
        <div className="flex justify-center">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#2A2A2A]" />
        </div>
      </div>

      {/* Card */}
      <div className={[
        'relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 select-none cursor-default',
        earned
          ? `${style.card}`
          : 'bg-[#161616] border-[#1E1E1E] opacity-40',
      ].join(' ')}>

        {/* Earned dot */}
        {earned && (
          <span className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${style.dot}`} />
        )}

        <span className={`text-4xl leading-none transition-all ${earned ? '' : 'grayscale'}`}>
          {definition.icon}
        </span>

        <p className="text-xs font-bold text-center text-text-primary leading-tight mt-0.5">
          {definition.name}
        </p>

        <p className={`text-[10px] text-center leading-tight ${earned ? style.text : 'text-text-muted'}`}>
          {earned ? definition.description : '???'}
        </p>

        {earned && dateLabel && (
          <p className="text-[9px] text-text-muted leading-none">{dateLabel}</p>
        )}
      </div>
    </div>
  )
}

import { BadgeDefinition } from '@/lib/badges'

interface Props {
  definition: BadgeDefinition
  earned: boolean
  earnedAt?: Date | null
}

export function BadgeCard({ definition, earned, earnedAt }: Props) {
  const dateLabel = earnedAt
    ? earnedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="relative group">

      {/* Tooltip */}
      <div className={[
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-48',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none',
      ].join(' ')}>
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3 shadow-2xl">
          <p className="text-text-primary text-xs font-bold mb-1">{definition.name}</p>
          <p className="text-text-muted text-[11px] leading-relaxed">
            {earned
              ? definition.description
              : 'Completa los requisitos para desbloquear este logro'}
          </p>
          {earned && dateLabel && (
            <p className="text-[#FF471A] text-[10px] mt-1.5 font-semibold">
              Desbloqueado el {dateLabel}
            </p>
          )}
          {!earned && (
            <p className="text-text-subtle text-[10px] mt-1.5">🔒 Bloqueado</p>
          )}
        </div>
        {/* Caret */}
        <div className="flex justify-center">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#2A2A2A]" />
        </div>
      </div>

      {/* Card */}
      <div className={[
        'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 select-none',
        earned
          ? 'bg-[#FF471A]/10 border-[#FF471A]/30 hover:border-[#FF471A]/60 hover:bg-[#FF471A]/15 cursor-default'
          : 'bg-[#161616] border-[#222222] opacity-50 cursor-default',
      ].join(' ')}>
        <span className={`text-4xl leading-none ${earned ? '' : 'grayscale'}`}>
          {definition.icon}
        </span>
        <p className="text-xs font-bold text-center text-text-primary leading-tight mt-1">
          {definition.name}
        </p>
        <p className={`text-[10px] text-center leading-tight ${
          earned ? 'text-[#FF471A]' : 'text-text-muted'
        }`}>
          {earned ? definition.description : '???'}
        </p>
        {earned && dateLabel && (
          <p className="text-[9px] text-text-muted leading-none">{dateLabel}</p>
        )}
      </div>

    </div>
  )
}

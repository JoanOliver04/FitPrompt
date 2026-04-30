import { Card } from '@/components/ui/Card'

interface Props {
  streak: number
  weight: number | null
  completionRate: number
  xpLevel: number
  xpLevelName: string
  xpCurrent: number
  xpMax: number
}

export default function MetricsGrid({
  streak,
  weight,
  completionRate,
  xpLevel,
  xpLevelName,
  xpCurrent,
  xpMax,
}: Props) {
  const metrics = [
    {
      label: 'Racha actual',
      value: `${streak}`,
      unit: 'días',
      icon: '🔥',
      accent: true,
    },
    {
      label: 'Peso actual',
      value: weight !== null ? `${weight}` : '—',
      unit: weight !== null ? 'kg' : 'sin registro',
      icon: '⚖️',
      accent: false,
    },
    {
      label: 'Nivel',
      value: `${xpLevel}`,
      unit: xpLevelName,
      icon: '⭐',
      accent: false,
      progress: { current: xpCurrent, max: xpMax },
    },
    {
      label: 'Cumplimiento',
      value: `${completionRate}`,
      unit: '%',
      icon: '✅',
      accent: false,
      progress: { current: completionRate, max: 100 },
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {metrics.map((m) => (
        <Card key={m.label} accent={m.accent} hoverable className="p-4">
          <div className="text-2xl mb-2">{m.icon}</div>
          <div className="text-2xl font-black text-white">{m.value}</div>
          <div className="text-xs text-[#E0E0E0]">{m.unit}</div>
          <div className="text-xs text-[#666] mt-0.5">{m.label}</div>

          {m.progress && (
            <div className="mt-2.5">
              <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF471A] rounded-full"
                  style={{ width: `${(m.progress.current / m.progress.max) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-[#555] mt-1">
                {m.progress.current} / {m.progress.max}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

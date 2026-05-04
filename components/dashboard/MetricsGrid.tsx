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

function complianceColor(rate: number): string {
  if (rate >= 80) return '#22c55e' // green
  if (rate >= 50) return '#eab308' // yellow
  return '#ef4444'                 // red
}

function complianceLabel(rate: number): string {
  if (rate >= 80) return '¡Genial!'
  if (rate >= 50) return 'Mejora posible'
  return 'Necesitas más'
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
  const color = complianceColor(completionRate)

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
      progress: { current: xpCurrent, max: xpMax, barColor: '#FF471A' },
    },
    {
      label: 'Cumplimiento',
      value: `${completionRate}`,
      unit: '%',
      icon: '✅',
      accent: false,
      progress: { current: completionRate, max: 100, barColor: color },
      statusLabel: complianceLabel(completionRate),
      statusColor: color,
    },
  ]

  const staggerDelays = [0, 80, 160, 240]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {metrics.map((m, i) => (
        <Card
          key={m.label}
          accent={m.accent}
          hoverable
          className="p-4 animate-enter"
          style={{ animationDelay: `${staggerDelays[i]}ms` }}
        >
          <div className="text-2xl mb-2">{m.icon}</div>
          <div className="text-2xl font-black text-text-primary">{m.value}</div>
          <div className="text-xs text-text-secondary">{m.unit}</div>
          <div className="text-xs text-text-muted mt-0.5">{m.label}</div>

          {m.progress && (
            <div className="mt-2.5">
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(m.progress.current / m.progress.max) * 100}%`,
                    backgroundColor: m.progress.barColor,
                  }}
                />
              </div>
              {'statusLabel' in m ? (
                <div className="text-[10px] mt-1 font-semibold" style={{ color: m.statusColor }}>
                  {m.statusLabel}
                </div>
              ) : (
                <div className="text-[10px] text-text-muted mt-1">
                  {m.progress.current} / {m.progress.max}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

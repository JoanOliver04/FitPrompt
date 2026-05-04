import { Card } from '@/components/ui/Card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  weightCurrent: number | null
  weightInitial: number | null
  totalWorkouts: number
  activeDays:    number
  avgDuration:   number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weightDiff(current: number | null, initial: number | null): number | null {
  if (current === null || initial === null) return null
  return Math.round((current - initial) * 10) / 10
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// ─── Sub-component ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon:    string
  value:   string
  unit:    string
  label:   string
  sub?:    React.ReactNode
  delay?:  number
}

function StatCard({ icon, value, unit, label, sub, delay = 0 }: StatCardProps) {
  return (
    <Card
      hoverable
      className="p-4 animate-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-black text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{unit}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
      {sub && <div className="mt-2">{sub}</div>}
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressCards({
  weightCurrent,
  weightInitial,
  totalWorkouts,
  activeDays,
  avgDuration,
}: Props) {
  const diff = weightDiff(weightCurrent, weightInitial)

  // Weight card sub-stat
  const weightSub = diff !== null ? (
    <span
      className="text-[11px] font-bold tabular-nums"
      style={{ color: diff < 0 ? '#22c55e' : diff > 0 ? '#FF471A' : '#888888' }}
    >
      {diff < 0 ? '▼' : diff > 0 ? '▲' : '→'}{' '}
      {diff !== 0 ? `${Math.abs(diff).toFixed(1)} kg` : 'sin cambio'}
      {weightInitial !== null && (
        <span className="text-text-subtle font-normal ml-1">
          desde {weightInitial.toFixed(1)} kg
        </span>
      )}
    </span>
  ) : weightInitial !== null ? (
    <span className="text-[11px] text-text-muted">Sin peso actual</span>
  ) : null

  const staggerDelays = [0, 80, 160, 240]

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-text-primary font-bold text-base">Progreso global</h2>
        <p className="text-text-muted text-xs mt-0.5">Estadísticas acumuladas desde el inicio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="⚖️"
          value={weightCurrent !== null ? weightCurrent.toFixed(1) : '—'}
          unit={weightCurrent !== null ? 'kg' : 'sin registro'}
          label="Peso actual"
          sub={weightSub}
          delay={staggerDelays[0]}
        />
        <StatCard
          icon="💪"
          value={String(totalWorkouts)}
          unit="sesiones"
          label="Completadas"
          sub={
            totalWorkouts > 0 ? (
              <span className="text-[11px] text-text-muted">en total</span>
            ) : (
              <span className="text-[11px] text-text-muted">Sin sesiones aún</span>
            )
          }
          delay={staggerDelays[1]}
        />
        <StatCard
          icon="📅"
          value={String(activeDays)}
          unit="días"
          label="Días activos"
          sub={
            activeDays > 0 ? (
              <span className="text-[11px] text-text-muted">con actividad registrada</span>
            ) : (
              <span className="text-[11px] text-text-muted">Empieza hoy</span>
            )
          }
          delay={staggerDelays[2]}
        />
        <StatCard
          icon="⏱️"
          value={avgDuration !== null ? formatDuration(avgDuration) : '—'}
          unit={avgDuration !== null ? 'por sesión' : 'sin datos'}
          label="Duración media"
          sub={
            avgDuration !== null ? (
              <span className="text-[11px] text-text-muted">
                {avgDuration >= 45 ? '¡Buen ritmo!' : 'Sigue sumando'}
              </span>
            ) : null
          }
          delay={staggerDelays[3]}
        />
      </div>
    </div>
  )
}

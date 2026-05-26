import { Card } from '@/components/ui/Card'

interface Props {
  streak:         number
  bestStreak:     number
  weekComplete:   boolean
  weight:         number | null
  weightInitial:  number | null
  completionRate: number
  xpLevel:        number
  xpLevelName:    string
  xpCurrent:      number
  xpMax:          number
  totalWorkouts:  number
  avgDuration:    number | null
}

function complianceColor(r: number) {
  if (r >= 80) return '#22c55e'
  if (r >= 50) return '#eab308'
  return '#ef4444'
}
function complianceLabel(r: number) {
  if (r >= 80) return '¡En racha!'
  if (r >= 50) return 'Casi ahí'
  return 'Dale caña'
}

export default function MetricsGrid({
  streak, bestStreak, weekComplete,
  weight, weightInitial,
  completionRate,
  xpLevel, xpLevelName, xpCurrent, xpMax,
  totalWorkouts, avgDuration,
}: Props) {
  const streakColor  = weekComplete ? '#22c55e' : streak > 0 ? '#FF471A' : '#555'
  const compliance   = complianceColor(completionRate)
  const weightDiff   = weight !== null && weightInitial !== null && weight !== weightInitial
    ? Math.round((weight - weightInitial) * 10) / 10
    : null

  const stagger = [0, 60, 120, 180, 240, 300]

  return (
    <div className="mb-8">
      <h2 className="text-text-primary font-bold text-base mb-4">Tus stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        {/* ── Racha ───────────────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[0]}ms` }}>
          <div className="text-xl mb-2">🔥</div>
          <div className="text-3xl font-black tabular-nums leading-none" style={{ color: streakColor }}>
            {streak > 0 ? streak : '—'}
          </div>
          <div className="text-xs text-text-secondary mt-1">sem. de racha</div>
          <div className="text-[11px] text-text-muted mt-1">
            {weekComplete
              ? '¡Semana completa! 🎉'
              : bestStreak > 0
                ? `Mejor: ${bestStreak} sem.`
                : 'Sin racha aún'}
          </div>
        </Card>

        {/* ── Peso ────────────────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[1]}ms` }}>
          <div className="text-xl mb-2">⚖️</div>
          <div className="text-3xl font-black tabular-nums leading-none text-text-primary">
            {weight !== null ? weight.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {weight !== null ? 'kg' : 'sin registro'}
          </div>
          {weightDiff !== null ? (
            <div
              className="text-[11px] font-bold mt-1 tabular-nums"
              style={{ color: weightDiff < 0 ? '#22c55e' : weightDiff > 0 ? '#FF471A' : '#666' }}
            >
              {weightDiff < 0 ? '▼' : weightDiff > 0 ? '▲' : '→'}{' '}
              {weightDiff !== 0 ? `${Math.abs(weightDiff).toFixed(1)} kg` : 'sin cambio'}
            </div>
          ) : (
            <div className="text-[11px] text-text-muted mt-1">
              {weight !== null ? 'peso inicial' : 'añade en Tracking'}
            </div>
          )}
        </Card>

        {/* ── Nivel ───────────────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[2]}ms` }}>
          <div className="text-xl mb-2">⭐</div>
          <div className="text-3xl font-black leading-none text-text-primary">
            {xpLevel}
          </div>
          <div className="text-xs text-text-secondary mt-1">{xpLevelName}</div>
          <div className="mt-3">
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((xpCurrent / xpMax) * 100, 100)}%`, backgroundColor: '#FF471A' }}
              />
            </div>
            <div className="text-[10px] text-text-muted mt-1 tabular-nums">
              {xpCurrent} / {xpMax} XP
            </div>
          </div>
        </Card>

        {/* ── Esta semana ─────────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[3]}ms` }}>
          <div className="text-xl mb-2">📅</div>
          <div className="text-3xl font-black tabular-nums leading-none" style={{ color: compliance }}>
            {completionRate}%
          </div>
          <div className="text-xs text-text-secondary mt-1">esta semana</div>
          <div className="mt-3">
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionRate}%`, backgroundColor: compliance }}
              />
            </div>
            <div className="text-[10px] mt-1 font-semibold" style={{ color: compliance }}>
              {complianceLabel(completionRate)}
            </div>
          </div>
        </Card>

        {/* ── Total entrenos ──────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[4]}ms` }}>
          <div className="text-xl mb-2">💪</div>
          <div className="text-3xl font-black tabular-nums leading-none text-text-primary">
            {totalWorkouts}
          </div>
          <div className="text-xs text-text-secondary mt-1">sesiones totales</div>
          <div className="text-[11px] text-text-muted mt-1">
            {totalWorkouts === 0
              ? 'Empieza hoy'
              : totalWorkouts < 10
                ? 'Buen comienzo'
                : totalWorkouts < 50
                  ? '¡Vas muy bien!'
                  : '¡Bestia absoluta!'}
          </div>
        </Card>

        {/* ── Duración media ──────────────────────────────── */}
        <Card hoverable className="p-4 animate-enter" style={{ animationDelay: `${stagger[5]}ms` }}>
          <div className="text-xl mb-2">⏱️</div>
          <div className="text-3xl font-black tabular-nums leading-none text-text-primary">
            {avgDuration !== null ? avgDuration : '—'}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {avgDuration !== null ? 'min por sesión' : 'sin datos'}
          </div>
          <div className="text-[11px] text-text-muted mt-1">
            {avgDuration === null
              ? 'registra entrenamientos'
              : avgDuration >= 60
                ? 'Sesiones largas 💯'
                : avgDuration >= 45
                  ? 'Buen ritmo'
                  : 'Sesiones cortas'}
          </div>
        </Card>

      </div>
    </div>
  )
}

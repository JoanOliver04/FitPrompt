'use client'

import { useMemo } from 'react'

interface WeightEntry   { weight: number; date: string }
interface ExerciseEntry { name: string; sets: number; reps: number; weight: number }
interface WorkoutEntry  { date: string; duration: number; completed: boolean; exercises: ExerciseEntry[] }

interface Props {
  weightLogs:  WeightEntry[]
  workoutLogs: WorkoutEntry[]
}

function SparkLine({ values, color = '#FF471A' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300, H = 60, pad = 4
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2)
    const y = pad + ((max - v) / range) * (H - pad * 2)
    return `${x},${y}`
  })
  const last = pts.at(-1)!.split(',')

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  )
}

export default function AdvancedMetrics({ weightLogs, workoutLogs }: Props) {
  const completed = useMemo(() => workoutLogs.filter(w => w.completed), [workoutLogs])

  const totalVolume = useMemo(() =>
    completed.reduce((sum, w) =>
      sum + w.exercises.reduce((s, ex) => s + (ex.weight > 0 ? ex.sets * ex.reps * ex.weight : 0), 0), 0
    ), [completed])

  const { longestStreak, thisMonth, avgDur } = useMemo(() => {
    const sortedDates = [...new Set(
      completed.map(w => new Date(w.date).toISOString().split('T')[0])
    )].sort()
    let best = 0, curr = 0, prevWeek = ''
    for (const d of sortedDates) {
      const date = new Date(d)
      const day = date.getDay()
      const monday = new Date(date)
      monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
      const week = monday.toISOString().split('T')[0]
      if (week !== prevWeek) { curr = prevWeek ? curr + 1 : 1; prevWeek = week }
      best = Math.max(best, curr)
    }
    const now = new Date()
    const month = completed.filter(w => {
      const d = new Date(w.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const avg = completed.length > 0
      ? Math.round(completed.reduce((s, w) => s + w.duration, 0) / completed.length)
      : 0
    return { longestStreak: best, thisMonth: month, avgDur: avg }
  }, [completed])

  // Last 12 weeks — volume bars
  const weeklyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, rev) => {
      const i = 11 - rev
      const start = new Date(now)
      start.setDate(now.getDate() - i * 7 - ((now.getDay() + 6) % 7))
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const week = completed.filter(w => { const d = new Date(w.date); return d >= start && d <= end })
      const vol = week.reduce((s, w) =>
        s + w.exercises.reduce((e, ex) => e + (ex.weight > 0 ? ex.sets * ex.reps * ex.weight : 0), 0), 0)
      return {
        label:    start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        sessions: week.length,
        volume:   vol,
      }
    })
  }, [completed])

  // Top 5 exercises by total volume
  const topExercises = useMemo(() => {
    const map = new Map<string, { volume: number; count: number; pr: number }>()
    for (const w of completed) {
      for (const ex of w.exercises) {
        const prev = map.get(ex.name) ?? { volume: 0, count: 0, pr: 0 }
        map.set(ex.name, {
          volume: prev.volume + ex.sets * ex.reps * ex.weight,
          count:  prev.count + 1,
          pr:     Math.max(prev.pr, ex.weight),
        })
      }
    }
    return [...map.entries()]
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
  }, [completed])

  const weightSeries = useMemo(() =>
    [...weightLogs].reverse().slice(-16).map(w => ({
      weight: w.weight,
      date:   new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    })), [weightLogs])

  if (completed.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 text-center">
        <p className="text-text-muted text-sm">Registra entrenamientos para ver tus métricas avanzadas.</p>
      </div>
    )
  }

  const volDisplay = totalVolume >= 1_000_000
    ? `${(totalVolume / 1_000_000).toFixed(2)}k t`
    : totalVolume >= 1000
    ? `${(totalVolume / 1000).toFixed(1)} t`
    : `${Math.round(totalVolume)} kg`

  const maxVol  = Math.max(...weeklyData.map(w => w.volume), 1)
  const maxExVol = topExercises[0]?.volume ?? 1

  const barColors = [
    'linear-gradient(to right, #FF471A, #ff7a50)',
    'linear-gradient(to right, #a78bfa, #c4b5fd)',
    'linear-gradient(to right, #34d399, #6ee7b7)',
    'linear-gradient(to right, #60a5fa, #93c5fd)',
    'linear-gradient(to right, #fb923c, #fdba74)',
    'linear-gradient(to right, #f472b6, #f9a8d4)',
  ]

  return (
    <div className="space-y-4">

      {/* Hero stats 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Sesiones totales', value: completed.length,   unit: 'entrenamientos', accent: '#FF471A' },
          { label: 'Volumen total',    value: volDisplay,          unit: 'levantado',      accent: '#a78bfa' },
          { label: 'Mejor racha',      value: longestStreak,       unit: 'sem. seguidas',  accent: '#34d399' },
          { label: 'Duración media',   value: `${avgDur}`,         unit: 'min / sesión',   accent: '#60a5fa' },
        ].map(({ label, value, unit, accent }) => (
          <div
            key={label}
            className="bg-bg-secondary border border-border-default rounded-2xl p-4 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{ background: `radial-gradient(circle at 80% 20%, ${accent}, transparent 70%)` }}
            />
            <p className="text-[10px] text-text-muted mb-1">{label}</p>
            <p className="text-3xl font-black tabular-nums leading-none" style={{ color: accent }}>{value}</p>
            <p className="text-[10px] text-text-subtle mt-1">{unit}</p>
          </div>
        ))}
      </div>

      {/* Weekly volume bars */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-primary font-bold text-sm">Volumen semanal</h3>
          <span className="text-[10px] text-text-muted bg-bg-primary px-2 py-0.5 rounded-full">Últimas 12 semanas</span>
        </div>
        <div className="flex items-end gap-[3px] h-[88px]">
          {weeklyData.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                <div
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: `${Math.max((w.volume / maxVol) * 68, w.sessions > 0 ? 6 : 0)}px`,
                    background: w.sessions > 0
                      ? 'linear-gradient(to top, #FF471A, #ff7a50)'
                      : 'var(--border-default)',
                    opacity: w.sessions > 0 ? 1 : 0.25,
                  }}
                />
              </div>
              <span className="text-[8px] text-text-muted text-center leading-none">
                {w.label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-default">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-[#FF471A]" />
            <span className="text-[10px] text-text-muted">kg totales levantados</span>
          </div>
          <span className="text-[10px] text-text-muted">
            Este mes: <span className="text-text-primary font-semibold">{thisMonth} sesiones</span>
          </span>
        </div>
      </div>

      {/* Top exercises */}
      {topExercises.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary font-bold text-sm">Ejercicios top</h3>
            <span className="text-[10px] text-text-muted">por volumen total</span>
          </div>
          <div className="space-y-3.5">
            {topExercises.map((ex, i) => (
              <div key={ex.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[9px] font-black w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: barColors[i], color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[13px] text-text-primary font-medium truncate">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <span className="text-[11px] text-text-muted">×{ex.count}</span>
                    {ex.pr > 0 && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,71,26,0.12)', color: '#FF471A' }}>
                        PR {ex.pr} kg
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(ex.volume / maxExVol) * 100}%`, background: barColors[i] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight trend */}
      {weightSeries.length >= 2 && (
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-text-primary font-bold text-sm">Evolución de peso</h3>
            <div className="text-right">
              <span className="text-2xl font-black tabular-nums text-text-primary leading-none">
                {weightSeries.at(-1)!.weight.toFixed(1)}
              </span>
              <span className="text-text-muted text-xs ml-1">kg</span>
              {(() => {
                const diff = Math.round((weightSeries.at(-1)!.weight - weightSeries[0].weight) * 10) / 10
                return (
                  <p className="text-[11px] font-bold mt-0.5" style={{ color: diff < 0 ? '#34d399' : diff > 0 ? '#f87171' : '#888' }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                  </p>
                )
              })()}
            </div>
          </div>
          <SparkLine values={weightSeries.map(w => w.weight)} color="#FF471A" />
          <div className="flex justify-between text-[10px] text-text-muted mt-1">
            <span>{weightSeries[0].date}</span>
            <span>{weightSeries.at(-1)!.date}</span>
          </div>
        </div>
      )}

      {/* Duration trend */}
      {completed.length >= 3 && (
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-text-primary font-bold text-sm">Duración por sesión</h3>
            <span className="text-[10px] text-text-muted">Últimas {Math.min(completed.length, 20)}</span>
          </div>
          <SparkLine
            values={[...completed].reverse().slice(-20).map(w => w.duration)}
            color="#a78bfa"
          />
          <div className="flex justify-between text-[10px] text-text-muted mt-1">
            <span>Hace {Math.min(completed.length, 20)} sesiones</span>
            <span>Hoy</span>
          </div>
        </div>
      )}

    </div>
  )
}

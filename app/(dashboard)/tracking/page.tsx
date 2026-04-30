import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tracking',
}

const weekData = [
  { day: 'L', weight: 75.2, done: true },
  { day: 'M', weight: 75.0, done: true },
  { day: 'X', weight: 74.8, done: true },
  { day: 'J', weight: 75.1, done: false },
  { day: 'V', weight: null, done: false },
  { day: 'S', weight: null, done: false },
  { day: 'D', weight: null, done: false },
]

const metrics = [
  { label: 'Peso actual', value: '74.8', unit: 'kg', delta: '-0.4', positive: true, icon: '⚖️' },
  { label: 'Entrenamientos', value: '3', unit: 'esta semana', delta: '+1', positive: true, icon: '💪' },
  { label: 'Calorías prom.', value: '2.340', unit: 'kcal/día', delta: '+40', positive: false, icon: '🔥' },
  { label: 'Racha activa', value: '5', unit: 'días', delta: '+1', positive: true, icon: '⚡' },
]

export default function TrackingPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Tracking</h1>
          <p className="text-text-secondary text-sm mt-1">Tu progreso de la semana</p>
        </div>
        <Link
          href="/chat"
          className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          + Registrar
        </Link>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-bg-secondary border border-border-default hover:border-[#FF471A33] rounded-2xl p-4 transition-colors"
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="flex items-end gap-1.5 mb-0.5">
              <span className="text-2xl font-black text-text-primary">{m.value}</span>
              <span className="text-xs text-text-muted mb-1">{m.unit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${m.positive ? 'text-green-400' : 'text-[#FF471A]'}`}>
                {m.delta}
              </span>
              <span className="text-xs text-text-muted">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly weight chart */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-bold">Peso esta semana</h2>
          <span className="text-xs text-text-muted">kg</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-24">
          {weekData.map((d) => {
            const maxW = 75.5
            const minW = 74.5
            const barH = d.weight ? Math.round(((d.weight - minW) / (maxW - minW)) * 100) : 0
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                {d.weight ? (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="text-[10px] text-text-secondary font-medium">{d.weight}</span>
                    <div
                      className="w-full bg-[#FF471A] rounded-t-lg transition-all"
                      style={{ height: `${Math.max(barH, 20)}%`, minHeight: '12px' }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 w-full bg-bg-tertiary rounded-t-lg opacity-30" style={{ minHeight: '24px' }} />
                )}
                <span className="text-xs text-text-muted font-medium">{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly workouts */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 mb-6">
        <h2 className="text-text-primary font-bold mb-4">Entrenamientos de la semana</h2>
        <div className="space-y-2">
          {[
            { day: 'Lunes',     name: 'Pecho + Tríceps',   duration: '55 min', done: true },
            { day: 'Martes',    name: 'Espalda + Bíceps',  duration: '50 min', done: true },
            { day: 'Miércoles', name: 'Piernas',            duration: '60 min', done: true },
            { day: 'Jueves',    name: 'Hombros + Core',    duration: '45 min', done: false },
            { day: 'Viernes',   name: 'Full Body',          duration: '50 min', done: false },
          ].map((w) => (
            <div
              key={w.day}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm ${
                w.done ? 'bg-bg-tertiary' : 'bg-bg-primary opacity-50'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                w.done ? 'bg-green-400/20 text-green-400' : 'bg-border-default text-text-muted'
              }`}>
                {w.done ? '✓' : '○'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{w.name}</p>
                <p className="text-text-muted text-xs">{w.day}</p>
              </div>
              <span className="text-text-muted text-xs shrink-0">{w.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Premium upsell */}
      <div className="bg-[#FF471A0D] border border-[#FF471A33] rounded-2xl p-5 flex items-center gap-4">
        <div className="text-3xl">📊</div>
        <div className="flex-1">
          <p className="text-text-primary font-bold text-sm">Gráficas detalladas en Premium</p>
          <p className="text-text-secondary text-xs mt-0.5">Evolución mensual, % grasa, IMC y mucho más</p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 bg-[#FF471A] hover:bg-[#e03d15] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Ver Premium
        </Link>
      </div>
    </div>
  )
}

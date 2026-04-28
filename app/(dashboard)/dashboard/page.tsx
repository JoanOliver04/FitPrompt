import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const stats = [
  { label: 'Racha actual', value: '5', unit: 'días', icon: '🔥' },
  { label: 'Peso actual', value: '75', unit: 'kg', icon: '⚖️' },
  { label: 'Nivel XP', value: '3', unit: 'Consistente', icon: '⭐' },
  { label: 'Cumplimiento', value: '80', unit: '%', icon: '✅' },
]

export default function DashboardPage() {
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[#666] text-sm mb-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-black text-white">
            ¡Hola, Atleta! 💪
          </h1>
          <p className="text-[#E0E0E0] text-sm mt-1">Llevas 5 días de racha. ¡Sigue así!</p>
        </div>
        <div className="bg-[#FF471A1A] border border-[#FF471A33] rounded-xl px-4 py-2 text-right">
          <div className="text-[#FF471A] text-2xl font-black">🔥 5</div>
          <div className="text-[#E0E0E0] text-xs">días racha</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 hover:border-[#FF471A33] transition-colors"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-[#E0E0E0]">{stat.unit}</div>
            <div className="text-xs text-[#666] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly Calendar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-8">
        <h2 className="text-white font-bold mb-4">Semana actual</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const isToday = i === todayIndex
            const isDone = i < todayIndex
            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-xs text-[#666] font-medium">{day}</span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isToday
                      ? 'bg-[#FF471A] text-white ring-2 ring-[#FF471A33]'
                      : isDone
                      ? 'bg-[#1DB95433] text-[#1DB954] border border-[#1DB95433]'
                      : 'bg-[#242424] text-[#666]'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's Plan */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold">Entrenamiento de hoy</h2>
          <span className="text-xs bg-[#FF471A1A] text-[#FF471A] px-3 py-1 rounded-full font-semibold">
            Pecho + Tríceps
          </span>
        </div>
        <div className="space-y-3 mb-4">
          {[
            { name: 'Press de banca', sets: '4', reps: '8-10', rest: '90s' },
            { name: 'Press inclinado con mancuernas', sets: '3', reps: '10-12', rest: '75s' },
            { name: 'Fondos en paralelas', sets: '3', reps: '12-15', rest: '60s' },
            { name: 'Extensiones de tríceps', sets: '3', reps: '12-15', rest: '60s' },
          ].map((ex) => (
            <div
              key={ex.name}
              className="flex items-center justify-between bg-[#242424] rounded-xl px-4 py-3 text-sm"
            >
              <span className="text-white font-medium">{ex.name}</span>
              <div className="flex gap-4 text-[#E0E0E0] text-xs">
                <span>{ex.sets} series</span>
                <span>{ex.reps} reps</span>
                <span className="text-[#666]">{ex.rest}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="flex-1 text-center bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl text-sm font-bold transition-all"
          >
            💬 Hablar con FitPrompt
          </Link>
          <button
            type="button"
            className="flex-1 bg-[#242424] hover:bg-[#2a2a2a] text-white py-3 rounded-xl text-sm font-semibold transition-colors border border-[#2a2a2a]"
          >
            ✓ Marcar completado
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📥', label: 'Descargar plan PDF', href: '#' },
          { icon: '🛒', label: 'Lista de la compra', href: '/chat' },
          { icon: '📊', label: 'Ver progreso', href: '/tracking' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#FF471A44] rounded-xl px-4 py-3 text-sm font-medium text-[#E0E0E0] hover:text-white transition-all"
          >
            <span className="text-xl">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

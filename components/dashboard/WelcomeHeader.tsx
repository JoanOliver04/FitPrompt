'use client'

interface Props {
  name:         string
  streak:       number
  bestStreak:   number
  weekComplete: boolean
}

export default function WelcomeHeader({ name, streak, bestStreak, weekComplete }: Props) {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })

  function streakMessage(): React.ReactNode {
    if (weekComplete) {
      return (
        <>
          <span className="text-green-400 font-bold">¡Semana completada! 🎉</span>
          {' '}
          {streak > 1
            ? `Llevas ${streak} semanas consecutivas. ¡Brutal!`
            : 'Primera semana completa. ¡Empieza la racha!'}
        </>
      )
    }
    if (streak > 0) {
      return (
        <>
          Llevas{' '}
          <span className="text-[#FF471A] font-bold">
            {streak} semana{streak !== 1 ? 's' : ''}
          </span>{' '}
          de racha. Completa esta semana para seguir.
        </>
      )
    }
    return 'Completa todos tus entrenamientos esta semana para iniciar tu racha.'
  }

  return (
    <div className="flex items-start justify-between mb-8 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-text-muted text-sm mb-1 capitalize">{today}</p>
        <h1 className="text-3xl font-black text-text-primary">
          ¡Hola, {name}! 💪
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {streakMessage()}
        </p>
      </div>

      <div className="flex-shrink-0 bg-[#FF471A1A] border border-[#FF471A33] rounded-2xl px-5 py-3 text-center min-w-[88px]">
        <div className={`text-3xl font-black leading-none ${weekComplete ? 'text-green-400' : 'text-[#FF471A]'}`}>
          🔥 {streak}
        </div>
        <div className="text-text-secondary text-xs mt-1 font-medium">sem. racha</div>
        {bestStreak > 0 && (
          <div className="text-text-muted text-[10px] mt-0.5">
            mejor: {bestStreak}
          </div>
        )}
      </div>
    </div>
  )
}

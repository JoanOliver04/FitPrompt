'use client'

interface Props {
  name: string
  streak: number
}

export default function WelcomeHeader({ name, streak }: Props) {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <p className="text-text-muted text-sm mb-1 capitalize">{today}</p>
        <h1 className="text-3xl font-black text-text-primary">
          ¡Hola, {name}! 💪
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {streak > 0 ? (
            <>
              Llevas{' '}
              <span className="text-[#FF471A] font-bold">{streak} día{streak !== 1 ? 's' : ''}</span>{' '}
              de racha consecutiva. ¡Sigue así!
            </>
          ) : (
            'Empieza hoy tu racha. ¡Tú puedes!'
          )}
        </p>
      </div>

      <div className="flex-shrink-0 bg-[#FF471A1A] border border-[#FF471A33] rounded-2xl px-5 py-3 text-center">
        <div className="text-[#FF471A] text-3xl font-black leading-none">
          🔥 {streak}
        </div>
        <div className="text-text-secondary text-xs mt-1 font-medium">días racha</div>
      </div>
    </div>
  )
}

'use client'

import { MOCK_USER } from './mock-data'

export default function WelcomeHeader() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <p className="text-[#666] text-sm mb-1 capitalize">{today}</p>
        <h1 className="text-3xl font-black text-white">
          ¡Hola, {MOCK_USER.name}! 💪
        </h1>
        <p className="text-[#E0E0E0] text-sm mt-1">
          Llevas{' '}
          <span className="text-[#FF471A] font-bold">{MOCK_USER.streak} días</span>{' '}
          de racha consecutiva. ¡Sigue así!
        </p>
      </div>

      <div className="flex-shrink-0 bg-[#FF471A1A] border border-[#FF471A33] rounded-2xl px-5 py-3 text-center">
        <div className="text-[#FF471A] text-3xl font-black leading-none">
          🔥 {MOCK_USER.streak}
        </div>
        <div className="text-[#E0E0E0] text-xs mt-1 font-medium">días racha</div>
      </div>
    </div>
  )
}

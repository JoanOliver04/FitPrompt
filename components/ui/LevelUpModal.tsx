'use client'

import { useState, useEffect } from 'react'
import type { LevelUpInfo } from '@/lib/xp'

const LEVEL_MESSAGES: Record<string, string> = {
  'Activo':      '¡Estás cogiendo ritmo! Sigue así.',
  'Consistente': '¡La constancia es tu superpoder!',
  'Atleta':      '¡Ya entrenas y piensas como un atleta de verdad!',
  'Guerrero':    '¡Nada ni nadie puede detenerte!',
  'Élite':       '¡Eres de los pocos que llegan aquí. Enhorabuena!',
  'Culturista':  '¡Tu dedicación es de otro nivel!',
  'Olimpia':     '¡Nivel olímpico desbloqueado. Extraordinario!',
  'Hulk':        '¡Fuerza imparable. Eres una máquina!',
  'Superman':    '¡Leyenda absoluta. Has llegado a la cima!',
}

interface Props {
  info:      LevelUpInfo
  onDismiss: () => void
}

export function LevelUpModal({ info, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 15)
    return () => clearTimeout(id)
  }, [])

  function handleDismiss() {
    setLeaving(true)
    setTimeout(onDismiss, 280)
  }

  const active = mounted && !leaving

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleDismiss}
    >
      <div
        className={`relative bg-[#141414] border border-[#FF471A]/40 rounded-3xl px-8 py-10 w-full max-w-sm mx-4 text-center shadow-2xl shadow-black/60 transition-all duration-300 ${active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-6'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-[#FF471A]/20 pointer-events-none" />

        {/* Icon */}
        <div className="text-5xl mb-5">🏆</div>

        {/* Headline */}
        <p className="text-[#FF471A] text-xs font-bold tracking-widest uppercase mb-1">
          Subida de nivel
        </p>
        <h2 className="text-white text-2xl font-bold mb-7">¡Has subido de nivel!</h2>

        {/* Level transition */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#606060] text-xs">Antes</span>
            <div className="bg-[#1F1F1F] border border-[#333] rounded-xl px-4 py-2 min-w-[72px]">
              <p className="text-[#999] text-xs">Nivel {info.from}</p>
            </div>
          </div>

          <span className="text-[#FF471A] text-xl font-bold leading-none">→</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[#FF471A] text-xs font-bold">Ahora</span>
            <div className="bg-[#FF471A]/10 border border-[#FF471A]/50 rounded-xl px-4 py-2 min-w-[72px]">
              <p className="text-[#FF471A] text-xs font-bold">Nivel {info.to}</p>
            </div>
          </div>
        </div>

        {/* New level badge */}
        <div className="bg-[#FF471A]/10 border border-[#FF471A]/30 rounded-2xl px-5 py-3 mb-5">
          <p className="text-[#FF471A] text-lg font-bold">{info.levelName}</p>
        </div>

        {/* Motivational message */}
        <p className="text-[#999] text-sm leading-relaxed mb-8">
          {LEVEL_MESSAGES[info.levelName] ?? '¡Sigue adelante. Lo estás haciendo genial!'}
        </p>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          className="w-full bg-[#FF471A] hover:bg-[#FF5530] active:scale-95 text-white font-bold py-3 rounded-xl transition-all duration-150"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

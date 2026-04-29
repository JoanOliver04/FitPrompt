import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Perfil',
}

const profileSections = [
  {
    title: 'Datos personales',
    items: [
      { label: 'Nombre', value: 'Atleta FitPrompt' },
      { label: 'Email', value: 'atleta@email.com' },
      { label: 'Edad', value: '25 años' },
    ],
  },
  {
    title: 'Datos físicos',
    items: [
      { label: 'Peso', value: '75 kg' },
      { label: 'Altura', value: '178 cm' },
      { label: 'Objetivo', value: 'Volumen' },
    ],
  },
  {
    title: 'Preferencias de entrenamiento',
    items: [
      { label: 'Nivel', value: 'Intermedio' },
      { label: 'Días/semana', value: '4 días' },
      { label: 'Tipo', value: 'Gimnasio' },
    ],
  },
]

const achievements = [
  { icon: '🏆', label: 'Primer Paso', unlocked: true },
  { icon: '📅', label: 'Semana 1', unlocked: true },
  { icon: '🔥', label: 'Constancia', unlocked: false },
  { icon: '💪', label: 'Bestia', unlocked: false },
]

export default function ProfilePage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <h1 className="text-3xl font-black text-white mb-8">Mi perfil</h1>

      {/* Avatar + stats */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0">
          <span className="text-4xl">👤</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-black text-white">Atleta FitPrompt</h2>
          <p className="text-[#E0E0E0] text-sm mb-3">atleta@email.com</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="bg-[#242424] rounded-xl px-4 py-2 text-center">
              <div className="text-[#FF471A] font-black text-lg">🔥 5</div>
              <div className="text-[#666] text-xs">Racha</div>
            </div>
            <div className="bg-[#242424] rounded-xl px-4 py-2 text-center">
              <div className="text-white font-black text-lg">⭐ 3</div>
              <div className="text-[#666] text-xs">Nivel</div>
            </div>
            <div className="bg-[#242424] rounded-xl px-4 py-2 text-center">
              <div className="text-white font-black text-lg">700 XP</div>
              <div className="text-[#666] text-xs">Experiencia</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="bg-[#2a2a2a] text-[#E0E0E0] text-xs font-semibold px-3 py-1 rounded-full text-center">
            Plan Free
          </span>
          <Link
            href="/pricing"
            className="bg-[#FF471A] hover:bg-[#e03d15] text-white text-xs font-bold px-4 py-1.5 rounded-full text-center transition-colors"
          >
            Ir a Premium
          </Link>
        </div>
      </div>

      {/* Profile sections */}
      <div className="space-y-4 mb-6">
        {profileSections.map((section) => (
          <div key={section.title} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">{section.title}</h3>
              <button
                type="button"
                className="text-[#FF471A] text-xs font-semibold hover:underline"
              >
                Editar
              </button>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#2a2a2a] last:border-0">
                  <span className="text-[#666] text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-6">
        <h3 className="text-white font-bold mb-4">Logros</h3>
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a) => (
            <div
              key={a.label}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${
                a.unlocked ? 'bg-[#FF471A1A] border border-[#FF471A33]' : 'bg-[#242424] opacity-40'
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs text-center text-[#E0E0E0] font-medium leading-tight">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href="/settings"
          className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-xl px-5 py-4 text-[#E0E0E0] hover:text-white transition-all"
        >
          <span className="text-sm font-medium">⚙️ Configuración</span>
          <span className="text-[#666]">›</span>
        </Link>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-xl px-5 py-4 text-[#E0E0E0] hover:text-white transition-all"
        >
          <span className="text-sm font-medium">🚪 Cerrar sesión</span>
          <span className="text-[#666]">›</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-[#1a1a1a] border border-red-900/30 hover:border-red-800/60 rounded-xl px-5 py-4 text-red-400 hover:text-red-300 transition-all"
        >
          <span className="text-sm font-medium">🗑️ Eliminar cuenta</span>
          <span className="opacity-50">›</span>
        </button>
      </div>
    </div>
  )
}

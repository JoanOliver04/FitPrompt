import Link from 'next/link'

const actions = [
  {
    icon: '🏋️',
    label: 'Registrar entrenamiento',
    description: 'Anota tu sesión de hoy',
    href: '/tracking',
  },
  {
    icon: '📚',
    label: 'Ver ejercicios',
    description: 'Biblioteca completa',
    href: '/chat',
  },
  {
    icon: '🛒',
    label: 'Lista de la compra',
    description: 'Genera tu lista semanal',
    href: '/chat',
  },
]

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-white font-bold mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#FF471A44] hover:bg-[#FF471A05] hover:scale-[1.01] rounded-xl px-4 py-4 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#242424] group-hover:bg-[#FF471A15] flex items-center justify-center text-xl shrink-0 transition-colors">
              {action.icon}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm">{action.label}</div>
              <div className="text-[#666] text-xs">{action.description}</div>
            </div>
            <span className="ml-auto text-[#444] group-hover:text-[#FF471A] transition-colors text-lg shrink-0">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

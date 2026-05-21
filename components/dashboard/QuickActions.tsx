import Link from 'next/link'

const actions = [
  {
    icon:        '🏋️',
    label:       'Registrar entreno',
    description: 'Anota tu sesión de hoy',
    href:        '/tracking',
  },
  {
    icon:        '💬',
    label:       'Chat con IA',
    description: 'Rutinas, dietas y consejos',
    href:        '/chat',
  },
  {
    icon:        '🏆',
    label:       'Social',
    description: 'Ranking y seguidores',
    href:        '/social',
  },
]

export default function QuickActions() {
  return (
    <div className="mb-8">
      <h2 className="text-text-primary font-bold mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, i) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-4 bg-bg-secondary border border-border-default hover:border-[#FF471A44] hover:bg-[#FF471A05] hover:scale-[1.01] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-xl px-4 py-4 transition-all duration-200 group animate-enter"
            style={{ animationDelay: `${300 + i * 80}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary group-hover:bg-[#FF471A15] flex items-center justify-center text-xl shrink-0 transition-colors">
              {action.icon}
            </div>
            <div className="min-w-0">
              <div className="text-text-primary font-semibold text-sm">{action.label}</div>
              <div className="text-text-muted text-xs">{action.description}</div>
            </div>
            <span className="ml-auto text-text-subtle group-hover:text-[#FF471A] transition-colors text-lg shrink-0">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

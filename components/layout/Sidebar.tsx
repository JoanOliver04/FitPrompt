'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Logo from '@/components/ui/Logo'
import type { Plan } from '@/types'

interface Props {
  collapsed: boolean
  mobileOpen: boolean
  onClose: () => void
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat IA',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    href: '/tracking',
    label: 'Tracking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/routines',
    label: 'Rutinas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12h10M5 8v8M19 8v8M3 9v6M21 9v6"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: '/exercises',
    label: 'Ejercicios',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 12h10M5 8v8M19 8v8M3 9v6M21 9v6"/>
      </svg>
    ),
  },
  {
    href: '/social',
    label: 'Social',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: '/groups',
    label: 'Grupos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        <line x1="19" y1="11" x2="19" y2="17"/>
        <line x1="22" y1="14" x2="16" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/challenges',
    label: 'Retos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: '/achievements',
    label: 'Logros',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export default function Sidebar({ collapsed, mobileOpen, onClose }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPremium = ((session?.user as { plan?: Plan })?.plan ?? 'free') === 'premium'

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-bg-secondary border-r border-border-default shrink-0',
        'transition-all duration-300 ease-in-out',
        'md:relative md:z-auto md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'md:w-16' : 'md:w-60',
        'w-72',
      ].join(' ')}
    >
      {/* Logo bar */}
      <div
        className={[
          'flex items-center h-14 shrink-0 border-b border-border-default',
          collapsed ? 'md:justify-center px-4' : 'px-5',
        ].join(' ')}
      >
        <div className={collapsed ? 'hidden md:flex' : 'flex'}>
          {collapsed ? (
            <Logo variant="icon" height={30} />
          ) : (
            <Logo height={34} />
          )}
        </div>
        <div className={collapsed ? 'flex md:hidden' : 'hidden'}>
          <Logo height={34} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
          aria-label="Cerrar menú"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={[
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 py-2.5',
                collapsed ? 'md:justify-center md:px-2 px-3' : 'px-3',
                isActive
                  ? 'bg-[#FF471A12] text-[#FF471A] border border-[#FF471A2A]'
                  : 'text-text-subtle hover:bg-bg-tertiary hover:text-text-primary border border-transparent',
              ].join(' ')}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF471A]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className={['p-3 border-t border-border-default', collapsed ? 'md:hidden' : ''].join(' ')}>
        {isPremium ? (
          <div className="bg-[#FF471A0F] border border-[#FF471A22] rounded-xl p-3.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 text-sm select-none">
              ⚡
            </div>
            <div className="min-w-0">
              <p className="text-[#FF471A] text-xs font-bold leading-tight">FitPrompt Premium</p>
              <p className="text-text-muted text-[10px] leading-tight mt-0.5">Sin límites activo</p>
            </div>
          </div>
        ) : (
          <div className="bg-bg-tertiary rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-text-secondary">Plan actual</span>
              <span className="text-[10px] bg-bg-primary text-text-muted px-2 py-0.5 rounded-full font-medium border border-border-default">
                Free
              </span>
            </div>
            <Link
              href="/pricing"
              className="block w-full text-center bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white text-xs font-bold py-2 rounded-lg transition-all"
            >
              Hazte Premium 🔥
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: '⚡' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/tracking', label: 'Stats', icon: '📊' },
  { href: '/social', label: 'Social', icon: '👥' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#1a1a1a] border-t border-[#2a2a2a] flex items-center pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-[#FF471A]' : 'text-[#666] hover:text-[#E0E0E0]'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

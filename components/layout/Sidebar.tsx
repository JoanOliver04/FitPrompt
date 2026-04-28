'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/chat', label: 'Chat IA', icon: '💬' },
  { href: '/tracking', label: 'Tracking', icon: '📊' },
  { href: '/social', label: 'Social', icon: '👥' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#1a1a1a] border-r border-[#2a2a2a] min-h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2a2a2a]">
        <div className="w-8 h-8 bg-[#FF471A] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-black text-sm">F</span>
        </div>
        <span className="text-white font-bold text-lg">FitPrompt</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF471A1A] text-[#FF471A] border border-[#FF471A33]'
                  : 'text-[#E0E0E0] hover:bg-[#242424] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF471A]" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: plan badge */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <div className="bg-[#242424] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#E0E0E0]">Plan actual</span>
            <span className="text-xs bg-[#2a2a2a] text-[#E0E0E0] px-2 py-0.5 rounded-full">Free</span>
          </div>
          <p className="text-xs text-[#666] mb-3">5 mensajes/día • 3 chats</p>
          <Link
            href="/pricing"
            className="block w-full text-center bg-[#FF471A] hover:bg-[#e03d15] text-white text-xs font-bold py-2 rounded-lg transition-colors"
          >
            Hazte Premium 🔥
          </Link>
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useState, useCallback } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileOpen(v => !v)
    } else {
      setCollapsed(v => !v)
    }
  }, [])

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={handleMenuClick} />
        <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

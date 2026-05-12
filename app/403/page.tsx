import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '403 — Sin acceso',
}

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-4xl font-black text-white mb-3">403</h1>
        <p className="text-[#E0E0E0] text-lg font-semibold mb-2">Acceso restringido</p>
        <p className="text-[#E0E0E0]/60 text-sm mb-8">
          No tienes permisos para acceder a esta página. Se requiere rol de administrador.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-[#FF471A] hover:bg-[#e03d15] text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}

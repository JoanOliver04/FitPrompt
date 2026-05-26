import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import RoutineList from '@/components/routines/RoutineList'

export const metadata: Metadata = { title: 'Mis Rutinas — FitPrompt' }

export default async function RoutinesPage() {
  const session = await getServerSession(authOptions)
  const userId  = session?.user?.id

  const routines = userId
    ? await db.routine.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          days: {
            orderBy: { dayIndex: 'asc' },
            select:  { id: true, dayIndex: true, name: true, _count: { select: { exercises: true } } },
          },
        },
      })
    : []

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Mis Rutinas</h1>
          <p className="text-text-secondary text-sm mt-1">Guarda rutinas desde el chat y úsalas en tracking</p>
        </div>
        <Link
          href="/chat"
          className="text-xs font-semibold text-[#FF471A] border border-[#FF471A33] hover:border-[#FF471A66] rounded-xl px-4 py-2 transition-all"
        >
          + Crear desde chat
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-[#FF471A0F] border border-[#FF471A22] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF471A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 12h10M5 8v8M19 8v8M3 9v6M21 9v6"/>
            </svg>
          </div>
          <h2 className="text-text-primary font-bold mb-2">Sin rutinas todavía</h2>
          <p className="text-text-muted text-sm mb-4">
            Pide tu rutina personalizada en el chat y guárdala con el botón que aparece en la respuesta.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-[#FF471A] hover:bg-[#E03D16] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Ir al chat IA
          </Link>
        </div>
      ) : (
        <RoutineList routines={routines.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))} />
      )}
    </div>
  )
}

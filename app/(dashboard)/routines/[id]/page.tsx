import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import DeleteRoutineButton from './DeleteRoutineButton'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }  = await params
  const routine = await db.routine.findUnique({ where: { id }, select: { name: true } })
  return { title: routine ? `${routine.name} — FitPrompt` : 'Rutina' }
}

export default async function RoutineDetailPage({ params }: Props) {
  const { id }    = await params
  const session   = await getServerSession(authOptions)

  const routine = await db.routine.findUnique({
    where:   { id },
    include: {
      days: {
        orderBy: { dayIndex: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!routine || routine.userId !== session?.user?.id) notFound()

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-enter">

      {/* Back */}
      <Link
        href="/routines"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6 group"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Mis Rutinas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{routine.name}</h1>
          <p className="text-text-muted text-xs mt-1">
            {routine.days.length} día{routine.days.length !== 1 ? 's' : ''} · creada el{' '}
            {routine.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <DeleteRoutineButton routineId={routine.id} />
      </div>

      {/* Days */}
      <div className="space-y-5">
        {routine.days.map((day) => (
          <div key={day.id} className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <div>
                <span className="text-[#FF471A] text-xs font-bold uppercase tracking-wider">
                  Día {day.dayIndex + 1}
                </span>
                <h2 className="text-text-primary font-bold text-base mt-0.5">{day.name}</h2>
              </div>
              <Link
                href={`/tracking?routineId=${routine.id}&dayId=${day.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FF471A] hover:bg-[#E03D16] text-white px-3.5 py-2 rounded-xl transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Entrenar
              </Link>
            </div>

            {/* Exercises table */}
            {day.exercises.length === 0 ? (
              <p className="px-5 py-4 text-text-muted text-sm">Sin ejercicios.</p>
            ) : (
              <div className="divide-y divide-border-default">
                <div className="grid grid-cols-12 px-5 py-2 text-[10px] text-text-muted uppercase tracking-wider">
                  <span className="col-span-6">Ejercicio</span>
                  <span className="col-span-2 text-center">Series</span>
                  <span className="col-span-2 text-center">Reps</span>
                  <span className="col-span-2 text-right">Descanso</span>
                </div>
                {day.exercises.map((ex) => (
                  <div key={ex.id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-bg-tertiary/40 transition-colors">
                    <span className="col-span-6 text-text-primary text-sm font-medium truncate pr-2">{ex.name}</span>
                    <span className="col-span-2 text-text-secondary text-sm text-center tabular-nums">{ex.sets}</span>
                    <span className="col-span-2 text-text-secondary text-sm text-center tabular-nums">{ex.reps}</span>
                    <span className="col-span-2 text-text-muted text-xs text-right">
                      {ex.restSeconds ? `${ex.restSeconds}s` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

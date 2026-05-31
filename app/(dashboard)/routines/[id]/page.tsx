import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import DeleteRoutineButton from './DeleteRoutineButton'
import RoutineEditor from './RoutineEditor'

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

  const initial = {
    id:   routine.id,
    name: routine.name,
    days: routine.days.map((d) => ({
      id:       d.id,
      dayIndex: d.dayIndex,
      name:     d.name,
      exercises: d.exercises.map((ex) => ({
        id:          ex.id,
        name:        ex.name,
        sets:        ex.sets,
        reps:        ex.reps,
        restSeconds: ex.restSeconds,
        order:       ex.order,
      })),
    })),
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-enter">

      <div className="flex items-center justify-between mb-6">
        <Link
          href="/routines"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Mis Rutinas
        </Link>
        <DeleteRoutineButton routineId={routine.id} />
      </div>

      <RoutineEditor routineId={routine.id} initial={initial} />
    </div>
  )
}

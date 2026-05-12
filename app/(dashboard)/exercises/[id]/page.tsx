import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getExerciseById, getExercises, MUSCLE_LABELS, TYPE_LABELS, LEVEL_LABELS, EQUIPMENT_LABELS, MUSCLE_COLORS } from '@/lib/exercises'
import { Card, CardContent } from '@/components/ui/Card'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const exercise = await getExerciseById(id)
  if (!exercise) return { title: 'Ejercicio no encontrado — FitPrompt' }
  return { title: `${exercise.name} — FitPrompt` }
}

export async function generateStaticParams() {
  const exercises = await getExercises()
  return exercises.map((e) => ({ id: e.id }))
}

const LEVEL_BADGE: Record<string, string> = {
  beginner:     'bg-green-500/15 text-green-400 border border-green-500/20',
  intermediate: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  advanced:     'bg-red-500/15 text-red-400 border border-red-500/20',
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params
  const exercise = await getExerciseById(id)
  if (!exercise) notFound()

  const color = MUSCLE_COLORS[exercise.muscleGroup]

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-enter">

      {/* Back link */}
      <Link
        href="/exercises"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6 group"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Volver a ejercicios
      </Link>

      {/* Hero */}
      <div
        className="rounded-2xl h-44 flex flex-col items-start justify-end px-8 pb-7 mb-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}2a 0%, ${color}0a 100%)`,
          border: `1px solid ${color}18`,
        }}
      >
        {/* Decorative bars */}
        <div className="absolute top-6 right-8 flex gap-[5px] items-end opacity-20">
          {[0.4, 0.65, 1, 0.8, 0.55, 0.75, 0.45].map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-full"
              style={{ height: `${h * 56}px`, backgroundColor: color }}
            />
          ))}
        </div>

        <p
          className="text-[11px] font-black uppercase tracking-[0.18em] mb-2 opacity-60"
          style={{ color }}
        >
          {MUSCLE_LABELS[exercise.muscleGroup]}
        </p>
        <h1 className="text-2xl font-black text-text-primary leading-tight">{exercise.name}</h1>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${LEVEL_BADGE[exercise.level]}`}>
          {LEVEL_LABELS[exercise.level]}
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-bg-tertiary text-text-secondary border border-border-default font-medium">
          {TYPE_LABELS[exercise.type]}
        </span>
        {exercise.equipment.map((eq) => (
          <span key={eq} className="text-xs px-3 py-1 rounded-full bg-bg-tertiary text-text-secondary border border-border-default font-medium">
            {EQUIPMENT_LABELS[eq]}
          </span>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mb-4">
        <CardContent>
          <h2 className="text-text-primary font-bold text-base mb-4 flex items-center gap-2.5">
            <span className="w-5 h-5 text-text-muted shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="4" rx="1"/>
                <path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="8" y1="16" x2="14" y2="16"/>
              </svg>
            </span>
            Instrucciones
          </h2>
          <ol className="space-y-3">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Muscles */}
      <Card className="mb-4">
        <CardContent>
          <h2 className="text-text-primary font-bold text-base mb-4 flex items-center gap-2.5">
            <span className="w-5 h-5 text-text-muted shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </span>
            Músculos trabajados
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-2">Primarios</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-2">Secundarios</p>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-bg-tertiary text-text-secondary border border-border-default font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent>
          <h2 className="text-text-primary font-bold text-base mb-4 flex items-center gap-2.5">
            <span className="w-5 h-5 text-text-muted shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            Recomendaciones
          </h2>
          <ul className="space-y-2.5">
            {exercise.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-text-secondary leading-relaxed">
                <span className="text-[#FF471A] shrink-0 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  )
}

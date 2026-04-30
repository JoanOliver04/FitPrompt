import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { Exercise } from '@/types'
import { MUSCLE_LABELS, TYPE_LABELS, LEVEL_LABELS, MUSCLE_COLORS, MUSCLE_ICONS } from '@/lib/exercises'

interface Props {
  exercise: Exercise
  style?: CSSProperties
}

const LEVEL_BADGE: Record<Exercise['level'], string> = {
  beginner:     'bg-green-500/15 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  advanced:     'bg-red-500/15 text-red-400 border-red-500/20',
}

export default function ExerciseCard({ exercise, style }: Props) {
  const color = MUSCLE_COLORS[exercise.muscleGroup]

  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="group flex flex-col bg-bg-secondary border border-border-default rounded-2xl overflow-hidden hover:border-[#FF471A44] hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 animate-enter"
      style={style}
    >
      {/* Image area */}
      <div
        className="h-28 flex items-center justify-center text-5xl relative shrink-0"
        style={{
          background: `linear-gradient(135deg, ${color}28 0%, ${color}0a 100%)`,
          borderBottom: `1px solid ${color}18`,
        }}
      >
        <span role="img" aria-label={MUSCLE_LABELS[exercise.muscleGroup]}>
          {MUSCLE_ICONS[exercise.muscleGroup]}
        </span>

        <span
          className={`absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${LEVEL_BADGE[exercise.level]}`}
        >
          {LEVEL_LABELS[exercise.level]}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-text-primary font-bold text-sm leading-snug group-hover:text-[#FF471A] transition-colors duration-150">
          {exercise.name}
        </h3>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          <Badge>{MUSCLE_LABELS[exercise.muscleGroup]}</Badge>
          <Badge>{TYPE_LABELS[exercise.type]}</Badge>
        </div>
      </div>
    </Link>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border-default font-medium">
      {children}
    </span>
  )
}

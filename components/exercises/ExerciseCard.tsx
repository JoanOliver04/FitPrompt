import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { Exercise } from '@/types'
import { MUSCLE_LABELS, TYPE_LABELS, LEVEL_LABELS, MUSCLE_COLORS } from '@/lib/exercises'

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
      {/* Visual header */}
      <div
        className="h-24 flex items-end justify-between px-4 pb-3 relative shrink-0"
        style={{
          background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
          borderBottom: `1px solid ${color}15`,
        }}
      >
        {/* Activity bars decoration */}
        <div className="flex gap-[3px] items-end">
          {[0.45, 0.7, 1, 0.8, 0.55].map((h, i) => (
            <div
              key={i}
              className="w-[5px] rounded-full transition-all duration-300 group-hover:opacity-80"
              style={{
                height: `${h * 32}px`,
                backgroundColor: color,
                opacity: 0.25 + i * 0.06,
              }}
            />
          ))}
        </div>

        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${LEVEL_BADGE[exercise.level]}`}
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
          <Badge color={color}>{MUSCLE_LABELS[exercise.muscleGroup]}</Badge>
          <Badge>{TYPE_LABELS[exercise.type]}</Badge>
        </div>
      </div>
    </Link>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  if (color) {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
      >
        {children}
      </span>
    )
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border-default font-medium">
      {children}
    </span>
  )
}

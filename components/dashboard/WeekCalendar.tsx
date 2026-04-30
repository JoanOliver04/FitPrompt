'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { MOCK_WEEK_PLAN } from './mock-data'

interface Props {
  completedDays: number[] // 0=Mon … 6=Sun
}

export default function WeekCalendar({ completedDays }: Props) {
  const rawDay = new Date().getDay()
  const todayIndex = rawDay === 0 ? 6 : rawDay - 1

  return (
    <Card className="mb-8">
      <CardHeader title="Semana actual" />
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {MOCK_WEEK_PLAN.map((day, i) => {
            const isToday = i === todayIndex
            const isDone = completedDays.includes(i)
            const isRest = day.muscle === 'Descanso'

            return (
              <div key={day.short} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-text-muted font-semibold uppercase">{day.short}</span>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isToday
                      ? 'bg-[#FF471A] text-white ring-2 ring-[#FF471A44] ring-offset-1 ring-offset-bg-secondary'
                      : isDone
                      ? 'bg-[#1DB95420] text-[#1DB954] border border-[#1DB95440]'
                      : isRest
                      ? 'bg-bg-tertiary text-text-muted'
                      : 'bg-bg-tertiary text-text-subtle'
                  }`}
                >
                  {isDone && !isToday ? '✓' : isRest ? '—' : i + 1}
                </div>

                <span
                  className={`text-[10px] text-center leading-tight ${
                    isToday ? 'text-[#FF471A] font-semibold' : 'text-text-muted'
                  }`}
                >
                  {isRest ? 'Desc.' : day.muscle}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

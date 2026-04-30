'use client'

import { MOCK_WEEK_PLAN } from './mock-data'

export default function WeekCalendar() {
  const rawDay = new Date().getDay() // 0=Sun … 6=Sat
  const todayIndex = rawDay === 0 ? 6 : rawDay - 1 // Mon=0 … Sun=6

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-8">
      <h2 className="text-white font-bold mb-4">Semana actual</h2>
      <div className="grid grid-cols-7 gap-2">
        {MOCK_WEEK_PLAN.map((day, i) => {
          const isToday = i === todayIndex
          const isDone = i < todayIndex
          const isRest = day.muscle === 'Descanso'

          return (
            <div key={day.short} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-[#666] font-semibold uppercase">{day.short}</span>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isToday
                    ? 'bg-[#FF471A] text-white ring-2 ring-[#FF471A44] ring-offset-1 ring-offset-[#1a1a1a]'
                    : isDone
                    ? 'bg-[#1DB95420] text-[#1DB954] border border-[#1DB95440]'
                    : isRest
                    ? 'bg-[#242424] text-[#3a3a3a]'
                    : 'bg-[#242424] text-[#555]'
                }`}
              >
                {isDone ? '✓' : isRest ? '—' : i + 1}
              </div>

              <span
                className={`text-[10px] text-center leading-tight ${
                  isToday ? 'text-[#FF471A] font-semibold' : 'text-[#555]'
                }`}
              >
                {isRest ? 'Desc.' : day.muscle}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

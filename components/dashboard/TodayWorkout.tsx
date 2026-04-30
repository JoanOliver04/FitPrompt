import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { MOCK_TODAY_WORKOUT } from './mock-data'

export default function TodayWorkout() {
  const { dayName, tag, exercises } = MOCK_TODAY_WORKOUT

  return (
    <Card className="mb-8">
      <CardHeader
        title={dayName}
        description="Tu entrenamiento de hoy"
        action={
          <span className="text-xs bg-[#FF471A1A] text-[#FF471A] px-3 py-1.5 rounded-full font-bold border border-[#FF471A33]">
            {tag}
          </span>
        }
      />

      <CardContent className="pt-3 space-y-2.5">
        {exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 bg-[#242424] hover:bg-[#2a2a2a] rounded-xl px-4 py-3 transition-colors"
          >
            <span className="text-[#FF471A] font-black text-sm w-5 shrink-0">{i + 1}</span>
            <span className="text-white font-medium text-sm flex-1">{ex.name}</span>
            <div className="flex items-center gap-2.5 text-xs shrink-0">
              <span className="text-[#E0E0E0] bg-[#1a1a1a] px-2 py-0.5 rounded-md font-medium">
                {ex.sets}×{ex.reps}
              </span>
              <span className="text-[#555] w-8 text-right">{ex.rest}</span>
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter bordered className="flex gap-3">
        <Link href="/chat" className="flex-1">
          <Button variant="primary" size="lg" className="w-full">
            💬 Ir al chat
          </Button>
        </Link>
        <Button variant="secondary" size="lg" className="flex-1">
          📋 Ver plan completo
        </Button>
      </CardFooter>
    </Card>
  )
}

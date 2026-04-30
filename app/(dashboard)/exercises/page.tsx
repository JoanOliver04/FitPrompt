import type { Metadata } from 'next'
import { getExercises } from '@/lib/exercises'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'

export const metadata: Metadata = {
  title: 'Ejercicios — FitPrompt',
}

export default async function ExercisesPage() {
  const exercises = await getExercises()

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full animate-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Biblioteca de ejercicios</h1>
        <p className="text-text-muted text-sm mt-1">
          Explora, filtra y aprende la técnica correcta de cada movimiento.
        </p>
      </div>

      <ExerciseCatalog exercises={exercises} />
    </div>
  )
}

import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WeightTracker } from '@/components/tracking/WeightTracker'
import type { WeightEntry } from '@/components/tracking/WeightTracker'

export const metadata: Metadata = {
  title: 'Tracking — FitPrompt',
}

async function getWeightLogs(userId: string): Promise<WeightEntry[]> {
  try {
    const logs = await db.weightLog.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
      select:  { id: true, weight: true, date: true },
    })
    return logs.map((l) => ({ id: l.id, weight: l.weight, date: l.date.toISOString() }))
  } catch {
    return []
  }
}

export default async function TrackingPage() {
  const session = await getServerSession(authOptions)
  const logs    = session?.user?.id ? await getWeightLogs(session.user.id) : []

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary">Tracking</h1>
        <p className="text-text-secondary text-sm mt-1">Registra tu peso y sigue tu evolución</p>
      </div>

      {/* Weight tracker — stats + form + history */}
      <WeightTracker initialLogs={logs} />

      {/* Workout tracking — future feature */}
      <div className="mt-6 bg-bg-secondary border border-border-default rounded-2xl p-5">
        <h2 className="text-text-primary font-bold text-sm mb-1">Entrenamientos</h2>
        <p className="text-text-muted text-xs">El registro de entrenamientos llegará pronto.</p>
      </div>

      {/* Premium upsell */}
      <div className="mt-6 bg-[#FF471A0D] border border-[#FF471A33] rounded-2xl p-5 flex items-center gap-4">
        <span className="text-3xl shrink-0" aria-hidden="true">📊</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-bold text-sm">Gráficas detalladas en Premium</p>
          <p className="text-text-secondary text-xs mt-0.5">
            Evolución mensual, % grasa corporal, IMC y mucho más
          </p>
        </div>
      </div>

    </div>
  )
}

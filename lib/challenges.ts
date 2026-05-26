// ─── Types ────────────────────────────────────────────────────────────────────

export type ChallengeType = 'workout_days' | 'weight_days' | 'workout_complete' | 'volume_kg' | 'chat_messages'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'

export interface ChallengeDefinition {
  id:          string
  title:       string
  description: string
  icon:        string
  xpReward:    number
  type:        ChallengeType
  target:      number
  difficulty:  ChallengeDifficulty
  color:       string   // accent color class
}

// ─── Challenge catalogue ──────────────────────────────────────────────────────

export const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
  // Easy
  {
    id: 'primeros_pasos', title: 'Primeros pasos',
    description: 'Completa 1 entrenamiento esta semana. El primer paso es el más difícil.',
    icon: '👟', xpReward: 50, type: 'workout_complete', target: 1,
    difficulty: 'easy', color: 'text-green-400',
  },
  {
    id: 'peso_basico', title: 'Básico en la báscula',
    description: 'Registra tu peso 3 días esta semana. Conoce tu cuerpo.',
    icon: '⚖️', xpReward: 75, type: 'weight_days', target: 3,
    difficulty: 'easy', color: 'text-green-400',
  },
  // Medium
  {
    id: 'workout_3_complete', title: 'Triple amenaza',
    description: 'Completa 3 entrenamientos esta semana. Sin excusas.',
    icon: '🔥', xpReward: 100, type: 'workout_complete', target: 3,
    difficulty: 'medium', color: 'text-[#FF471A]',
  },
  {
    id: 'fitcoach_pro', title: 'FitCoach Pro',
    description: 'Envía 10 mensajes al FitCoach esta semana. Aprovecha tu IA.',
    icon: '🤖', xpReward: 100, type: 'chat_messages', target: 10,
    difficulty: 'medium', color: 'text-[#FF471A]',
  },
  {
    id: 'workout_5_days', title: 'Guerrero semanal',
    description: 'Entrena 5 días distintos esta semana. La constancia es poder.',
    icon: '🏋️', xpReward: 200, type: 'workout_days', target: 5,
    difficulty: 'medium', color: 'text-[#FF471A]',
  },
  {
    id: 'weight_7_days', title: 'Control total',
    description: 'Registra tu peso los 7 días de la semana. Datos = resultados.',
    icon: '📊', xpReward: 150, type: 'weight_days', target: 7,
    difficulty: 'medium', color: 'text-[#FF471A]',
  },
  // Hard
  {
    id: 'cinco_en_racha', title: 'Cinco en racha',
    description: 'Completa 5 entrenamientos esta semana. Tu cuerpo puede más.',
    icon: '⚡', xpReward: 250, type: 'workout_complete', target: 5,
    difficulty: 'hard', color: 'text-amber-400',
  },
  {
    id: 'la_bestia', title: 'La Bestia',
    description: 'Mueve 5,000 kg de volumen total esta semana. Pura potencia.',
    icon: '🦁', xpReward: 350, type: 'volume_kg', target: 5000,
    difficulty: 'hard', color: 'text-amber-400',
  },
  {
    id: 'sin_excusas', title: 'Sin excusas',
    description: 'Entrena los 7 días de la semana. Leyendas solamente.',
    icon: '🌋', xpReward: 500, type: 'workout_days', target: 7,
    difficulty: 'hard', color: 'text-amber-400',
  },
  // Legendary
  {
    id: 'titan_volumen', title: 'Titán del Volumen',
    description: 'Mueve 10,000 kg esta semana. Para los que no conocen límites.',
    icon: '👑', xpReward: 600, type: 'volume_kg', target: 10000,
    difficulty: 'legendary', color: 'text-purple-400',
  },
]

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getWeekStart(): Date {
  const now  = new Date()
  const day  = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy:      'Fácil',
  medium:    'Medio',
  hard:      'Difícil',
  legendary: 'Legendario',
}

export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  easy:      'text-green-400 bg-green-400/10 border-green-400/20',
  medium:    'text-[#FF471A] bg-[#FF471A]/10 border-[#FF471A]/20',
  hard:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
  legendary: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

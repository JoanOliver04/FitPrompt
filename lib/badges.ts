import { db } from '@/lib/db'
import { BadgeId } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeCategory = 'entrenamiento' | 'constancia' | 'hitos' | 'social' | 'retos' | 'fitcoach' | 'premium'

export interface BadgeDefinition {
  id:          BadgeId
  name:        string
  description: string
  icon:        string
  color:       'orange' | 'red' | 'amber' | 'purple' | 'green' | 'blue' | 'teal'
  category:    BadgeCategory
  hint:        string
  premium:     boolean
}

// ─── Definitions ──────────────────────────────────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDefinition[] = [

  // ── Entrenamiento ──────────────────────────────────────────────────────────
  {
    id: BadgeId.first_step, name: 'Primer Paso',
    description: 'Completaste tu perfil y empezaste el viaje',
    icon: '👟', color: 'orange', category: 'entrenamiento', premium: false,
    hint: 'Completa el onboarding para desbloquearlo',
  },
  {
    id: BadgeId.week_1, name: 'Semana 1',
    description: 'Tu primera semana de entrenamientos',
    icon: '📅', color: 'orange', category: 'entrenamiento', premium: false,
    hint: 'Completa un entreno en tu primera semana',
  },
  {
    id: BadgeId.beast, name: 'La Bestia',
    description: '20 entrenamientos completados. Eres imparable.',
    icon: '🦁', color: 'orange', category: 'entrenamiento', premium: false,
    hint: 'Completa 20 entrenamientos en total',
  },
  {
    id: BadgeId.iron_will, name: 'Voluntad de Hierro',
    description: '30 entrenamientos. Tu disciplina es legendaria.',
    icon: '💪', color: 'orange', category: 'entrenamiento', premium: true,
    hint: 'Completa 30 entrenamientos en total',
  },
  {
    id: BadgeId.centurion, name: 'Centurión',
    description: '100 entrenamientos. La élite de la élite.',
    icon: '⚔️', color: 'amber', category: 'entrenamiento', premium: true,
    hint: 'Completa 100 entrenamientos en total',
  },

  // ── Constancia ─────────────────────────────────────────────────────────────
  {
    id: BadgeId.consistency, name: 'Constancia',
    description: '7 días seguidos entrenando sin excusas',
    icon: '🔥', color: 'red', category: 'constancia', premium: false,
    hint: 'Entrena 7 días consecutivos',
  },
  {
    id: BadgeId.committed, name: 'Comprometido',
    description: '2 semanas seguidas. El hábito ya es tuyo.',
    icon: '🎯', color: 'red', category: 'constancia', premium: false,
    hint: 'Consigue una racha de 2 semanas',
  },
  {
    id: BadgeId.streak_3weeks, name: 'En Llamas',
    description: '3 semanas de racha. Nadie te para.',
    icon: '🌋', color: 'red', category: 'constancia', premium: true,
    hint: 'Consigue una racha de 3 semanas seguidas',
  },
  {
    id: BadgeId.weigher, name: 'Pesador',
    description: '7 días seguidos registrando tu peso',
    icon: '⚖️', color: 'blue', category: 'constancia', premium: false,
    hint: 'Registra tu peso 7 días consecutivos',
  },

  // ── Hitos ──────────────────────────────────────────────────────────────────
  {
    id: BadgeId.volume_king, name: 'Rey del Volumen',
    description: 'Moviste 10,000 kg en total. Brutal.',
    icon: '👑', color: 'amber', category: 'hitos', premium: true,
    hint: 'Acumula 10,000 kg de volumen total (series × reps × peso)',
  },
  {
    id: BadgeId.level_5_badge, name: 'Guerrero',
    description: 'Alcanzaste el nivel 5. El camino no hace más que empezar.',
    icon: '⭐', color: 'amber', category: 'hitos', premium: true,
    hint: 'Sube al nivel 5 acumulando XP',
  },
  {
    id: BadgeId.premium, name: 'Premium',
    description: 'Eres parte de la élite de FitPrompt',
    icon: '⚡', color: 'amber', category: 'hitos', premium: true,
    hint: 'Activa el plan Premium',
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  {
    id: BadgeId.social, name: 'Sociable',
    description: 'Consiguiste tu primer seguidor. Ya eres inspiración.',
    icon: '👋', color: 'purple', category: 'social', premium: false,
    hint: 'Consigue que alguien te siga',
  },
  {
    id: BadgeId.social_butterfly, name: 'Mariposa Social',
    description: '5 seguidores. Tu energía contagia.',
    icon: '🦋', color: 'purple', category: 'social', premium: true,
    hint: 'Consigue 5 seguidores',
  },
  {
    id: BadgeId.group_founder, name: 'Fundador',
    description: 'Creaste tu primer grupo. El líder nació.',
    icon: '🏰', color: 'purple', category: 'social', premium: true,
    hint: 'Crea tu primer grupo (requiere Premium)',
  },
  {
    id: BadgeId.group_top, name: 'Élite del Grupo',
    description: 'Top 3 en el ranking de un grupo. Inalcanzable.',
    icon: '🥇', color: 'purple', category: 'social', premium: true,
    hint: 'Llega al top 3 del ranking de un grupo',
  },
  {
    id: BadgeId.sharer, name: 'Compartidor',
    description: 'Exportaste tu primer plan en PDF',
    icon: '📤', color: 'purple', category: 'social', premium: false,
    hint: 'Exporta un plan en PDF desde el chat',
  },

  // ── Retos ──────────────────────────────────────────────────────────────────
  {
    id: BadgeId.challenge_done, name: 'Retador',
    description: 'Completaste tu primer reto semanal. Ahora a por más.',
    icon: '🏆', color: 'green', category: 'retos', premium: false,
    hint: 'Acepta y completa cualquier reto semanal',
  },
  {
    id: BadgeId.challenger_3, name: 'Campeón de Retos',
    description: '3 retos completados. Las dificultades te motivan.',
    icon: '🎮', color: 'green', category: 'retos', premium: true,
    hint: 'Completa 3 retos semanales en total',
  },

  // ── FitCoach ───────────────────────────────────────────────────────────────
  {
    id: BadgeId.chat_starter, name: 'FitCoach Rookie',
    description: 'Primera conversación con tu entrenador IA',
    icon: '🤖', color: 'teal', category: 'fitcoach', premium: false,
    hint: 'Envía tu primer mensaje al FitCoach',
  },
  {
    id: BadgeId.nutritionist, name: 'Nutricionista',
    description: 'Consultaste al FitCoach 20 veces. Eres un pro.',
    icon: '🥗', color: 'teal', category: 'fitcoach', premium: true,
    hint: 'Envía 20 mensajes al FitCoach en total',
  },
]

export const BADGE_BY_ID = new Map(BADGE_DEFINITIONS.map(b => [b.id, b]))

export const BADGE_CATEGORIES: Array<{ id: BadgeCategory; label: string }> = [
  { id: 'entrenamiento', label: '💪 Entrenamiento' },
  { id: 'constancia',    label: '🔥 Constancia'    },
  { id: 'hitos',         label: '🏅 Hitos'         },
  { id: 'social',        label: '👥 Social'         },
  { id: 'retos',         label: '🎯 Retos'          },
  { id: 'fitcoach',      label: '🤖 FitCoach'       },
]

// ─── Core award ───────────────────────────────────────────────────────────────

export async function awardBadge(userId: string, badge: BadgeId): Promise<boolean> {
  try {
    await db.achievement.create({ data: { userId, badge } })
    return true
  } catch {
    return false
  }
}

// ─── Day helpers ──────────────────────────────────────────────────────────────

function dayKey(d: Date): string { return d.toISOString().split('T')[0] }

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function hasConsecutiveWorkoutDays(userId: string, days: number): Promise<boolean> {
  const logs = await db.workoutLog.findMany({
    where:  { userId, completed: true, date: { gte: daysAgo(days - 1) } },
    select: { date: true },
  })
  const present = new Set(logs.map(l => dayKey(l.date)))
  for (let i = 0; i < days; i++) {
    if (!present.has(dayKey(daysAgo(i)))) return false
  }
  return true
}

async function hasConsecutiveWeightDays(userId: string, days: number): Promise<boolean> {
  const logs = await db.weightLog.findMany({
    where:  { userId, date: { gte: daysAgo(days - 1) } },
    select: { date: true },
  })
  const present = new Set(logs.map(l => dayKey(l.date)))
  for (let i = 0; i < days; i++) {
    if (!present.has(dayKey(daysAgo(i)))) return false
  }
  return true
}

// ─── Triggered on workout complete ────────────────────────────────────────────

export async function checkAndAwardConsistency(userId: string): Promise<BadgeDefinition | null> {
  if (!(await hasConsecutiveWorkoutDays(userId, 7))) return null
  const awarded = await awardBadge(userId, BadgeId.consistency)
  return awarded ? (BADGE_BY_ID.get(BadgeId.consistency) ?? null) : null
}

export async function checkAndAwardWorkoutMilestones(userId: string): Promise<BadgeDefinition | null> {
  const count = await db.workoutLog.count({ where: { userId, completed: true } })
  const milestones: Array<[number, BadgeId]> = [
    [100, BadgeId.centurion],
    [30,  BadgeId.iron_will],
    [20,  BadgeId.beast],
  ]
  for (const [target, badge] of milestones) {
    if (count >= target) {
      const awarded = await awardBadge(userId, badge)
      if (awarded) return BADGE_BY_ID.get(badge) ?? null
    }
  }
  return null
}

export async function checkAndAwardVolumeMilestone(userId: string): Promise<BadgeDefinition | null> {
  const exs = await db.workoutExercise.findMany({
    where:  { userId, weight: { gt: 0 } },
    select: { sets: true, reps: true, weight: true },
  })
  const total = exs.reduce((s, e) => s + e.sets * e.reps * e.weight, 0)
  if (total < 10000) return null
  const awarded = await awardBadge(userId, BadgeId.volume_king)
  return awarded ? (BADGE_BY_ID.get(BadgeId.volume_king) ?? null) : null
}

export async function checkAndAwardLevel5(userId: string): Promise<BadgeDefinition | null> {
  const xp = await db.userXP.findUnique({ where: { userId }, select: { totalXP: true } })
  if (!xp || xp.totalXP < 3000) return null   // level 5 threshold
  const awarded = await awardBadge(userId, BadgeId.level_5_badge)
  return awarded ? (BADGE_BY_ID.get(BadgeId.level_5_badge) ?? null) : null
}

// ─── Triggered on weight log ──────────────────────────────────────────────────

export async function checkAndAwardWeigher(userId: string): Promise<BadgeDefinition | null> {
  if (!(await hasConsecutiveWeightDays(userId, 7))) return null
  const awarded = await awardBadge(userId, BadgeId.weigher)
  return awarded ? (BADGE_BY_ID.get(BadgeId.weigher) ?? null) : null
}

// ─── Triggered on streak update ───────────────────────────────────────────────

export async function checkAndAwardStreakBadges(userId: string, currentStreak: number): Promise<void> {
  if (currentStreak >= 2) await awardBadge(userId, BadgeId.committed)
  if (currentStreak >= 3) await awardBadge(userId, BadgeId.streak_3weeks)
}

// ─── Triggered on follow (award to the FOLLOWED user) ────────────────────────

export async function checkAndAwardSocialBadges(followedUserId: string): Promise<void> {
  const count = await db.follow.count({ where: { followingId: followedUserId } })
  if (count >= 1) await awardBadge(followedUserId, BadgeId.social)
  if (count >= 5) await awardBadge(followedUserId, BadgeId.social_butterfly)
}

// ─── Triggered on challenge complete ─────────────────────────────────────────

export async function checkAndAwardChallengeBadges(userId: string): Promise<BadgeDefinition | null> {
  const count = await db.userChallenge.count({ where: { userId, completed: true } })
  if (count === 1) {
    const awarded = await awardBadge(userId, BadgeId.challenge_done)
    return awarded ? (BADGE_BY_ID.get(BadgeId.challenge_done) ?? null) : null
  }
  if (count >= 3) {
    const awarded = await awardBadge(userId, BadgeId.challenger_3)
    return awarded ? (BADGE_BY_ID.get(BadgeId.challenger_3) ?? null) : null
  }
  return null
}

// ─── Triggered on chat message ────────────────────────────────────────────────

export async function checkAndAwardChatBadges(userId: string): Promise<void> {
  const chats = await db.chat.findMany({ where: { userId }, select: { id: true } })
  const count = await db.message.count({
    where: { chatId: { in: chats.map(c => c.id) }, role: 'user' },
  })
  if (count >= 1)  await awardBadge(userId, BadgeId.chat_starter)
  if (count >= 20) await awardBadge(userId, BadgeId.nutritionist)
}

// ─── Triggered on group create ────────────────────────────────────────────────

export async function checkAndAwardGroupFounder(userId: string): Promise<void> {
  await awardBadge(userId, BadgeId.group_founder)
}

// ─── Triggered on PDF export ─────────────────────────────────────────────────

export async function checkAndAwardSharer(userId: string): Promise<void> {
  await awardBadge(userId, BadgeId.sharer)
}

// ─── Triggered on Premium upgrade ────────────────────────────────────────────

export async function checkAndAwardPremium(userId: string): Promise<void> {
  await awardBadge(userId, BadgeId.premium)
}

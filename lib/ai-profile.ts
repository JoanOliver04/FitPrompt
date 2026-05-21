import { db } from '@/lib/db'
import type { UserProfile } from '@/types'

/**
 * Loads the user's profile for AI prompt generation, overriding the onboarding
 * `weight` with the most recent WeightLog entry when one exists.
 *
 * `UserProfile.weight` is captured once at onboarding and never updated, so the
 * macro/BMR/TDEE math in `lib/prompts.ts` would otherwise stay frozen at the
 * initial value even after the user logs new weights. WeightLog is the source of
 * truth for current weight (the dashboard already follows this same pattern).
 */
export async function loadAIProfile(userId: string): Promise<UserProfile | null> {
  const [profile, latestWeight] = await Promise.all([
    db.userProfile.findUnique({ where: { userId } }),
    db.weightLog.findFirst({
      where:   { userId },
      orderBy: { date: 'desc' },
      select:  { weight: true },
    }),
  ])

  if (!profile) return null

  return {
    ...profile,
    weight: latestWeight?.weight ?? profile.weight,
  } as unknown as UserProfile
}

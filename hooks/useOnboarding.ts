'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { UserProfile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingData {
  name: string
  age: string
  weight: string
  height: string
  gender: string
  goal: string
  level: string
  daysPerWeek: string
  sessionTime: string
  workoutType: string
  schedule: string
  injuries: string
  allergies: string
  foodPreferences: string[]
  extraInfo: string
}

export type StepErrors = Partial<Record<keyof OnboardingData, string>>

export const STEPS = [
  'Datos básicos',
  'Objetivo',
  'Entrenamiento',
  'Salud',
  'Extra',
] as const

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_DATA: OnboardingData = {
  name: '',
  age: '',
  weight: '',
  height: '',
  gender: '',
  goal: '',
  level: '',
  daysPerWeek: '4',
  sessionTime: '',
  workoutType: '',
  schedule: '',
  injuries: '',
  allergies: '',
  foodPreferences: [],
  extraInfo: '',
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, data: OnboardingData): StepErrors {
  const e: StepErrors = {}
  switch (step) {
    case 0:
      if (!data.name.trim()) e.name = 'El nombre es obligatorio'
      if (!data.age || Number(data.age) < 10 || Number(data.age) > 100)
        e.age = 'Introduce una edad válida (10–100)'
      if (!data.weight || Number(data.weight) < 20 || Number(data.weight) > 300)
        e.weight = 'Introduce un peso válido (20–300 kg)'
      if (!data.height || Number(data.height) < 100 || Number(data.height) > 250)
        e.height = 'Introduce una altura válida (100–250 cm)'
      if (!data.gender) e.gender = 'Selecciona un género'
      break
    case 1:
      if (!data.goal) e.goal = 'Selecciona un objetivo'
      if (!data.level) e.level = 'Selecciona tu nivel'
      if (!data.sessionTime) e.sessionTime = 'Selecciona el tiempo por sesión'
      break
    case 2:
      if (!data.workoutType) e.workoutType = 'Selecciona el tipo de rutina'
      if (!data.schedule) e.schedule = 'Selecciona tu horario preferido'
      break
    // Steps 3 (health) and 4 (extra) are fully optional
  }
  return e
}

// ─── Data mapping ─────────────────────────────────────────────────────────────

const GENDER_MAP: Record<string, UserProfile['gender']> = {
  Hombre: 'male',
  Mujer: 'female',
  'Prefiero no decirlo': 'other',
}

const GOAL_MAP: Record<string, UserProfile['goal']> = {
  volumen: 'volume',
  definicion: 'definition',
  mantenimiento: 'maintenance',
  perderpeso: 'weight_loss',
}

const LEVEL_MAP: Record<string, UserProfile['level']> = {
  Principiante: 'beginner',
  Intermedio: 'intermediate',
  Avanzado: 'advanced',
}

const SESSION_TIME_MAP: Record<string, UserProfile['sessionTime']> = {
  '< 30 min': '<30',
  '30–45 min': '30-45',
  '45–60 min': '45-60',
  '+ 60 min': '>60',
}

const SCHEDULE_MAP: Record<string, UserProfile['schedule']> = {
  'Mañana 🌅': 'morning',
  'Mediodía ☀️': 'midday',
  'Tarde 🌇': 'afternoon',
  'Noche 🌙': 'night',
}

export function toUserProfile(
  data: OnboardingData,
): Omit<UserProfile, 'userId'> & { name: string } {
  return {
    name: data.name.trim(),
    age: Number(data.age),
    weight: Number(data.weight),
    height: Number(data.height),
    gender: GENDER_MAP[data.gender] ?? 'other',
    goal: GOAL_MAP[data.goal] ?? 'maintenance',
    level: LEVEL_MAP[data.level] ?? 'beginner',
    daysPerWeek: Number(data.daysPerWeek),
    sessionTime: SESSION_TIME_MAP[data.sessionTime] ?? '<30',
    workoutType: data.workoutType as UserProfile['workoutType'],
    schedule: SCHEDULE_MAP[data.schedule] ?? 'morning',
    injuries: data.injuries.trim() || undefined,
    allergies: data.allergies.trim() || undefined,
    foodPreferences: data.foodPreferences,
    extraInfo: data.extraInfo.trim() || undefined,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<StepErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData, { isHydrated, removeValue }] = useLocalStorage<OnboardingData>(
    'fitprompt_onboarding',
    INITIAL_DATA,
  )

  const set = useCallback(
    (field: keyof OnboardingData, value: string) =>
      setData((prev) => ({ ...prev, [field]: value })),
    [setData],
  )

  const toggleFoodPref = useCallback(
    (pref: string) =>
      setData((prev) => ({
        ...prev,
        foodPreferences: prev.foodPreferences.includes(pref)
          ? prev.foodPreferences.filter((p) => p !== pref)
          : [...prev.foodPreferences, pref],
      })),
    [setData],
  )

  const goNext = useCallback(async () => {
    const stepErrors = validateStep(step, data)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})

    if (step === STEPS.length - 1) {
      setIsSubmitting(true)
      try {
        const profile = toUserProfile(data)
        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        })
        removeValue()
      } catch {
        // network error — don't block the user
      } finally {
        setIsSubmitting(false)
      }
      router.push('/dashboard')
    } else {
      setStep((s) => s + 1)
    }
  }, [step, data, router, removeValue])

  const goBack = useCallback(() => {
    setErrors({})
    setStep((s) => Math.max(0, s - 1))
  }, [])

  return {
    step,
    data,
    errors,
    isSubmitting,
    isHydrated,
    set,
    toggleFoodPref,
    goNext,
    goBack,
  }
}

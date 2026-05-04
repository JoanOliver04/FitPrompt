// ─── User & Auth ─────────────────────────────────────────────────────────────

export type Plan = 'free' | 'premium'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  plan: Plan
  createdAt: Date
}

export interface UserProfile {
  userId: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  goal: 'volume' | 'definition' | 'maintenance' | 'weight_loss'
  level: 'beginner' | 'intermediate' | 'advanced'
  daysPerWeek: number
  sessionTime: '<30' | '30-45' | '45-60' | '>60'
  workoutType: 'gym' | 'home' | 'bodyweight'
  schedule: 'morning' | 'midday' | 'afternoon' | 'night'
  injuries?: string
  allergies?: string
  foodPreferences: string[]
  extraInfo?: string
}

// ─── Chat & Messages ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  chatId: string
  role: MessageRole
  content: string
  createdAt: Date
}

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount?: number
  lastMessage?: string
}

// ─── Tracking ────────────────────────────────────────────────────────────────

export interface WorkoutLog {
  id: string
  userId: string
  date: Date
  exercises: ExerciseLog[]
  duration: number
  completed: boolean
  notes?: string
}

export interface ExerciseLog {
  name: string
  sets: SetLog[]
}

export interface SetLog {
  reps: number
  weight: number
  rpe?: number
}

export interface WeightLog {
  id: string
  userId: string
  weight: number
  date: Date
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface XP {
  userId: string
  totalXP: number
  level: number
}

export interface Achievement {
  id: string
  badge: BadgeId
  unlockedAt: Date
}

export type BadgeId =
  | 'first_step'
  | 'week_1'
  | 'consistency'
  | 'beast'
  | 'committed'
  | 'weigher'
  | 'nutritionist'
  | 'social'
  | 'sharer'
  | 'premium'
  | 'challenge_done'
  | 'group_top'

// ─── Exercises ────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'full_body'

export type ExerciseType = 'strength' | 'cardio' | 'hiit' | 'flexibility'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'bodyweight'
  | 'cables'
  | 'kettlebell'
  | 'bands'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles: string[]
  type: ExerciseType
  equipment: Equipment[]
  level: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  muscles: string[]
  tips: string[]
}

// ─── Shopping List ────────────────────────────────────────────────────────────

/** Marker prefix stored in the content field of shopping-list assistant messages. */
export const SHOPPING_LIST_SENTINEL = '__SHOPPING_LIST__:'

export interface ShoppingListItem {
  name: string
  amount: string
}

export interface ShoppingListCategory {
  name: string
  emoji: string
  items: ShoppingListItem[]
}

export interface ShoppingList {
  categories: ShoppingListCategory[]
  /** Human-readable markdown used as AI history context. */
  summary: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
  upgradeUrl?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

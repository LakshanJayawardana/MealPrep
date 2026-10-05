export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Meal {
  id: string
  name: string
  cuisine: string | null
  meal_type: MealType
  tags: string[]
  /** IDs of ingredients marked as primary for this meal */
  primaryIngredientIds: string[]
}

export interface ScoredMeal extends Meal {
  score: number
  reasons: string[]
}

export interface GeneratorWeights {
  /** Penalty per repeat of an exact meal within the recent window */
  repeat: number
  /** Penalty per primary ingredient shared with recent meals */
  ingredient: number
  /** Penalty per meal with the same cuisine in the recent window */
  cuisine: number
  /** Penalty per shared tag */
  tag: number
}

export interface GeneratorOptions {
  /** Number of days to plan */
  days: number
  /** Which meal slots to fill each day */
  slots: MealType[]
  /** How many previous meals to consider when scoring */
  recentWindow: number
  /** Tunable scoring weights */
  weights: GeneratorWeights
}

export interface GeneratedDay {
  dayIndex: number
  meals: ScoredMeal[]
}

export const DEFAULT_WEIGHTS: GeneratorWeights = {
  repeat: 50,
  ingredient: 12,
  cuisine: 6,
  tag: 2,
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  days: 7,
  slots: ['lunch', 'dinner'],
  recentWindow: 4, // last 4 meals considered "recent"
  weights: DEFAULT_WEIGHTS,
}

export const BASE_SCORE = 100
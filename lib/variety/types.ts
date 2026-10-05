export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MealRole = 'curry' | 'carb' | 'breakfast' | 'dish' | 'other'

export interface Meal {
  id: string
  name: string
  role: MealRole
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
  repeat: number
  ingredient: number
  cuisine: number
  tag: number
}

export interface GeneratorOptions {
  days: number
  /** Which slots to fill. Breakfast slots produce 1 meal; lunch/dinner produce curry + carb. */
  slots: MealType[]
  /** How many previous meals to consider when scoring */
  recentWindow: number
  weights: GeneratorWeights
  /** Which roles to pair in a main slot. Default: ['curry', 'carb'] */
  mainSlotRoles: MealRole[]
}

export interface GeneratedSlot {
  slot: MealType
  meals: ScoredMeal[]
}

export interface GeneratedDay {
  dayIndex: number
  slots: GeneratedSlot[]
}

export const DEFAULT_WEIGHTS: GeneratorWeights = {
  repeat: 50,
  ingredient: 12,
  cuisine: 2, // low — all SL meals share cuisine
  tag: 2,
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  days: 7,
  slots: ['breakfast', 'lunch', 'dinner'],
  recentWindow: 4,
  weights: DEFAULT_WEIGHTS,
  mainSlotRoles: ['curry', 'carb'],
}

export const BASE_SCORE = 100
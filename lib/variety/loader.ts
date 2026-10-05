import type { SupabaseClient } from '@supabase/supabase-js'
import type { Meal, MealRole, MealType } from './types'

export async function loadMeals(
  supabase: SupabaseClient,
  userId: string,
  includeCatalog: boolean
): Promise<Meal[]> {
  let query = supabase
    .from('meals')
    .select(
      'id, name, role, cuisine, meal_type, tags, meal_ingredients(ingredient_id, is_primary)'
    )

  if (includeCatalog) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`)
  } else {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to load meals: ${error.message}`)

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: (row.role ?? 'dish') as MealRole,
    cuisine: row.cuisine,
    meal_type: row.meal_type as MealType,
    tags: row.tags ?? [],
    primaryIngredientIds: (row.meal_ingredients ?? [])
      .filter((mi: { is_primary: boolean }) => mi.is_primary)
      .map((mi: { ingredient_id: string }) => mi.ingredient_id),
  }))
}
import {
  BASE_SCORE,
  DEFAULT_OPTIONS,
  type GeneratedDay,
  type GeneratedSlot,
  type GeneratorOptions,
  type GeneratorWeights,
  type Meal,
  type MealRole,
  type ScoredMeal,
} from './types'

/**
 * Generate a meal plan with role-aware pairing.
 *
 * For each day and each slot:
 *  - breakfast slot → 1 meal from role='breakfast'
 *  - lunch/dinner slot → 1 meal from each role in `mainSlotRoles` (default: curry + carb)
 *
 * Variety is enforced within each role pool — so you won't get chicken curry
 * three days running, and you won't get rice seven days running.
 */
export function generatePlan(
  availableMeals: Meal[],
  options: Partial<GeneratorOptions> = {}
): GeneratedDay[] {
  const opts: GeneratorOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights: { ...DEFAULT_OPTIONS.weights, ...options.weights },
  }

  const plan: GeneratedDay[] = []
  const history: ScoredMeal[] = []

  for (let day = 0; day < opts.days; day++) {
    const slots: GeneratedSlot[] = []

    for (const slot of opts.slots) {
      const slotMeals = pickMealsForSlot(
        slot,
        availableMeals,
        history,
        opts
      )

      if (slotMeals.length > 0) {
        slots.push({ slot, meals: slotMeals })
        history.push(...slotMeals)
      }
    }

    plan.push({ dayIndex: day, slots })
  }

  return plan
}

/**
 * Decide which meals fill a given slot.
 * Breakfast: 1 meal from role='breakfast' (fallback to meal_type='breakfast').
 * Lunch/dinner: 1 meal from each role in mainSlotRoles.
 */
function pickMealsForSlot(
  slot: string,
  allMeals: Meal[],
  history: ScoredMeal[],
  opts: GeneratorOptions
): ScoredMeal[] {
  const recent = history.slice(-opts.recentWindow)
  const picked: ScoredMeal[] = []

  if (slot === 'breakfast') {
  // Breakfast = 1 breakfast-carb + 1 breakfast-curry (or standalone breakfast).
  // If the catalog doesn't have that structure, fall back to a single meal.

  const breakfastCarbs = allMeals.filter(
    (m) => m.role === 'carb' && m.meal_type === 'breakfast'
  )
  const breakfastCurries = allMeals.filter(
    (m) =>
      (m.role === 'curry' || m.role === 'breakfast') &&
      m.meal_type === 'breakfast'
  )

  // If we have both pools, pair them
  if (breakfastCarbs.length > 0 && breakfastCurries.length > 0) {
    const carb = pickBest(breakfastCarbs, recent, opts.weights)
    if (carb) picked.push(carb)

    const contextualRecent = [...recent, ...picked]
    const curry = pickBest(breakfastCurries, contextualRecent, opts.weights)
    if (curry) picked.push(curry)

    return picked
  }

  // Fallback: any standalone breakfast meal
  const candidates = allMeals.filter(
    (m) => m.role === 'breakfast' || m.meal_type === 'breakfast'
  )
  if (candidates.length === 0) return []
  const chosen = pickBest(candidates, recent, opts.weights)
  if (chosen) picked.push(chosen)
  return picked
}

  // lunch / dinner / snack
  // Try each role in mainSlotRoles. If a role has no candidates, skip it
  // (e.g., if the catalog has no carbs yet).
  for (const role of opts.mainSlotRoles) {
    const candidates = allMeals.filter(
      (m) => m.role === role && matchesSlot(m, slot)
    )
    if (candidates.length === 0) continue

    // Combine recent history with meals we've already picked for this slot
    const contextualRecent = [...recent, ...picked]
    const chosen = pickBest(candidates, contextualRecent, opts.weights)
    if (chosen) picked.push(chosen)
  }

  // If no roles matched at all, fall back to any meal with matching meal_type
  // so a misconfigured catalog doesn't produce empty days.
  if (picked.length === 0) {
    const fallback = allMeals.filter((m) => m.meal_type === slot)
    if (fallback.length > 0) {
      const chosen = pickBest(fallback, recent, opts.weights)
      if (chosen) picked.push(chosen)
    }
  }

  return picked
}

/**
 * A meal "matches" a slot if its meal_type equals the slot, OR if it's a
 * flexible dish (dish/curry/carb) that could go in any main slot.
 * This lets curries meant for "lunch" appear at dinner too, which matches
 * how Sri Lankan households actually eat.
 */
function matchesSlot(meal: Meal, slot: string): boolean {
  if (meal.meal_type === slot) return true
  // Curries and carbs are flexible — they can slot into lunch or dinner
  if (meal.role === 'curry' || meal.role === 'carb') {
    return slot === 'lunch' || slot === 'dinner'
  }
  return false
}

/**
 * Pick the highest-scored meal from a candidate list.
 */
function pickBest(
  candidates: Meal[],
  recent: Meal[],
  weights: GeneratorWeights
): ScoredMeal | null {
  if (candidates.length === 0) return null
  const scored = candidates.map((m) => scoreMeal(m, recent, weights))
  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}

/**
 * Score a single meal against recent history. Higher is better.
 */
export function scoreMeal(
  meal: Meal,
  recent: Meal[],
  weights: GeneratorWeights
): ScoredMeal {
  let score = BASE_SCORE
  const reasons: string[] = []

  const exactRepeats = recent.filter((m) => m.id === meal.id).length
  if (exactRepeats > 0) {
    score -= exactRepeats * weights.repeat
    reasons.push(`repeated ${exactRepeats}× recently`)
  }

  const recentPrimary = new Set(recent.flatMap((m) => m.primaryIngredientIds))
  const ingredientOverlap = meal.primaryIngredientIds.filter((id) =>
    recentPrimary.has(id)
  ).length
  if (ingredientOverlap > 0) {
    score -= ingredientOverlap * weights.ingredient
    reasons.push(`${ingredientOverlap} primary ingredient overlap`)
  }

  if (meal.cuisine) {
    const cuisineRepeats = recent.filter(
      (m) => m.cuisine && m.cuisine === meal.cuisine
    ).length
    if (cuisineRepeats > 0) {
      score -= cuisineRepeats * weights.cuisine
      reasons.push(`same cuisine ${cuisineRepeats}×`)
    }
  }

  const recentTags = new Set(recent.flatMap((m) => m.tags))
  const tagOverlap = meal.tags.filter((t) => recentTags.has(t)).length
  if (tagOverlap > 0) {
    score -= tagOverlap * weights.tag
    reasons.push(`${tagOverlap} shared tag${tagOverlap === 1 ? '' : 's'}`)
  }

  if (reasons.length === 0) reasons.push('no conflicts with recent meals')

  return { ...meal, score, reasons }
}
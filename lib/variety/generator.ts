import {
  BASE_SCORE,
  DEFAULT_OPTIONS,
  type GeneratedDay,
  type GeneratorOptions,
  type GeneratorWeights,
  type Meal,
  type ScoredMeal,
} from './types'

/**
 * Generate a meal plan that maximizes variety across the given meals.
 *
 * The algorithm is a greedy scorer: for each slot in each day, it picks
 * the meal with the highest score given what was recently chosen. This is
 * not globally optimal, but it's fast, predictable, and degrades gracefully
 * when the available meals are limited.
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
    const dayMeals: ScoredMeal[] = []

    for (const slot of opts.slots) {
      const candidates = availableMeals.filter((m) => m.meal_type === slot)

      if (candidates.length === 0) continue

      const recent = history.slice(-opts.recentWindow)

      const scored = candidates.map((m) => scoreMeal(m, recent, opts.weights))
      scored.sort((a, b) => b.score - a.score)

      const chosen = scored[0]
      dayMeals.push(chosen)
      history.push(chosen)
    }

    plan.push({ dayIndex: day, meals: dayMeals })
  }

  return plan
}

/**
 * Score a single meal against recent history. Higher is better.
 * The reasons array explains *why* the meal was penalized — useful for UI.
 */
export function scoreMeal(
  meal: Meal,
  recent: Meal[],
  weights: GeneratorWeights
): ScoredMeal {
  let score = BASE_SCORE
  const reasons: string[] = []

  // Exact repeat penalty
  const exactRepeats = recent.filter((m) => m.id === meal.id).length
  if (exactRepeats > 0) {
    score -= exactRepeats * weights.repeat
    reasons.push(`repeated ${exactRepeats}× recently`)
  }

  // Primary ingredient overlap
  const recentPrimary = new Set(recent.flatMap((m) => m.primaryIngredientIds))
  const ingredientOverlap = meal.primaryIngredientIds.filter((id) =>
    recentPrimary.has(id)
  ).length
  if (ingredientOverlap > 0) {
    score -= ingredientOverlap * weights.ingredient
    reasons.push(`${ingredientOverlap} primary ingredient overlap`)
  }

  // Cuisine overlap
  if (meal.cuisine) {
    const cuisineRepeats = recent.filter(
      (m) => m.cuisine && m.cuisine === meal.cuisine
    ).length
    if (cuisineRepeats > 0) {
      score -= cuisineRepeats * weights.cuisine
      reasons.push(`same cuisine ${cuisineRepeats}×`)
    }
  }

  // Tag overlap
  const recentTags = new Set(recent.flatMap((m) => m.tags))
  const tagOverlap = meal.tags.filter((t) => recentTags.has(t)).length
  if (tagOverlap > 0) {
    score -= tagOverlap * weights.tag
    reasons.push(`${tagOverlap} shared tag${tagOverlap === 1 ? '' : 's'}`)
  }

  if (reasons.length === 0) reasons.push('no conflicts with recent meals')

  return { ...meal, score, reasons }
}
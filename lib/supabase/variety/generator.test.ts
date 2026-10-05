import { describe, expect, it } from 'vitest'
import { generatePlan, scoreMeal } from './generator'
import { DEFAULT_WEIGHTS, type Meal } from './types'

// ---- Fixtures ----
// Deliberately isolated so each test can measure one penalty at a time.

const chickenAsian: Meal = {
  id: '1',
  name: 'Grilled Chicken & Rice',
  cuisine: 'asian',
  meal_type: 'lunch',
  tags: ['high-protein'],
  primaryIngredientIds: ['chicken'],
}

const chickenAsianDupe: Meal = {
  id: '2',
  name: 'Chicken Broccoli Bowl',
  cuisine: 'asian',
  meal_type: 'lunch',
  tags: ['high-protein'],
  primaryIngredientIds: ['chicken'],
}

// Same primary ingredient, different cuisine, different tags
const chickenWestern: Meal = {
  id: '3',
  name: 'Roast Chicken',
  cuisine: 'western',
  meal_type: 'lunch',
  tags: ['comfort'],
  primaryIngredientIds: ['chicken'],
}

// Different primary, same cuisine as chickenAsian
const tofuAsian: Meal = {
  id: '4',
  name: 'Tofu Rice Bowl',
  cuisine: 'asian',
  meal_type: 'lunch',
  tags: ['vegetarian'],
  primaryIngredientIds: ['tofu'],
}

// Different primary, different cuisine, same tag as chickenAsian
const lettuceWestern: Meal = {
  id: '5',
  name: 'Chicken Salad',
  cuisine: 'western',
  meal_type: 'lunch',
  tags: ['high-protein'],
  primaryIngredientIds: ['lettuce'],
}

// Dinner options for plan-level tests
const beefItalian: Meal = {
  id: '6',
  name: 'Beef Pasta',
  cuisine: 'italian',
  meal_type: 'dinner',
  tags: ['comfort'],
  primaryIngredientIds: ['beef'],
}

const salmonWestern: Meal = {
  id: '7',
  name: 'Salmon & Quinoa',
  cuisine: 'western',
  meal_type: 'dinner',
  tags: ['healthy'],
  primaryIngredientIds: ['salmon'],
}

const pastaItalian: Meal = {
  id: '8',
  name: 'Tomato Pasta',
  cuisine: 'italian',
  meal_type: 'dinner',
  tags: ['vegetarian'],
  primaryIngredientIds: ['pasta'],
}

const allMeals: Meal[] = [
  chickenAsian,
  chickenAsianDupe,
  chickenWestern,
  tofuAsian,
  lettuceWestern,
  beefItalian,
  salmonWestern,
  pastaItalian,
]

// ---- scoreMeal tests ----

describe('scoreMeal', () => {
  it('gives a fresh meal the base score with no penalties', () => {
    const result = scoreMeal(chickenAsian, [], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100)
    expect(result.reasons).toContain('no conflicts with recent meals')
  })

  it('penalizes exact repeats with all overlapping axes', () => {
    // Same meal = repeat + ingredient + cuisine + tag all stack
    const result = scoreMeal(chickenAsian, [chickenAsian], DEFAULT_WEIGHTS)
    const expectedPenalty =
      DEFAULT_WEIGHTS.repeat +
      DEFAULT_WEIGHTS.ingredient +
      DEFAULT_WEIGHTS.cuisine +
      DEFAULT_WEIGHTS.tag
    expect(result.score).toBe(100 - expectedPenalty)
    expect(result.reasons.some((r) => r.includes('repeated'))).toBe(true)
  })

  it('penalizes shared primary ingredients in isolation', () => {
    // chickenWestern vs chickenAsian: same primary, different cuisine/tags
    const result = scoreMeal(chickenWestern, [chickenAsian], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100 - DEFAULT_WEIGHTS.ingredient)
    expect(result.reasons.some((r) => r.includes('primary ingredient'))).toBe(true)
  })

  it('penalizes shared cuisine in isolation', () => {
    // tofuAsian vs chickenAsian: same cuisine, different primary/tags
    const result = scoreMeal(tofuAsian, [chickenAsian], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100 - DEFAULT_WEIGHTS.cuisine)
    expect(result.reasons.some((r) => r.includes('same cuisine'))).toBe(true)
  })

  it('penalizes shared tags in isolation', () => {
    // lettuceWestern vs chickenAsian: same tag, different primary/cuisine
    const result = scoreMeal(lettuceWestern, [chickenAsian], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100 - DEFAULT_WEIGHTS.tag)
    expect(result.reasons.some((r) => r.includes('shared tag'))).toBe(true)
  })

  it('stacks penalties when a meal conflicts on multiple axes', () => {
    // chickenAsianDupe vs chickenAsian — identical on all axes
    const result = scoreMeal(chickenAsianDupe, [chickenAsian], DEFAULT_WEIGHTS)
    const expectedPenalty =
      DEFAULT_WEIGHTS.ingredient + DEFAULT_WEIGHTS.cuisine + DEFAULT_WEIGHTS.tag
    // No "repeat" because IDs differ
    expect(result.score).toBe(100 - expectedPenalty)
  })
})

// ---- generatePlan tests ----

describe('generatePlan', () => {
  it('produces the requested number of days and slots', () => {
    const plan = generatePlan(allMeals, { days: 5 })
    expect(plan).toHaveLength(5)
    plan.forEach((day) => {
      expect(day.meals).toHaveLength(2) // lunch + dinner
    })
  })

  it('respects slots when a candidate pool exists', () => {
    const plan = generatePlan(allMeals, { days: 3 })
    plan.forEach((day) => {
      expect(day.meals[0].meal_type).toBe('lunch')
      expect(day.meals[1].meal_type).toBe('dinner')
    })
  })

  it('avoids repeating the same lunch two days in a row when alternatives exist', () => {
    const plan = generatePlan(allMeals, { days: 3 })
    const lunchIds = plan.map((d) => d.meals[0].id)
    expect(new Set(lunchIds).size).toBeGreaterThanOrEqual(2)
  })

  it('rotates through all available lunches before repeating', () => {
    // 5 lunches available, 5 days — should use all 5 at least once
    const plan = generatePlan(allMeals, { days: 5, recentWindow: 10 })
    const lunchIds = plan.map((d) => d.meals[0].id)
    expect(new Set(lunchIds).size).toBe(5)
  })

  it('handles a slot with no candidates gracefully', () => {
    const plan = generatePlan(allMeals, {
      days: 2,
      slots: ['lunch', 'dinner', 'snack'],
    })
    plan.forEach((day) => {
      // snack slot is silently skipped
      expect(day.meals).toHaveLength(2)
    })
  })

  it('returns deterministic output for the same input', () => {
    const a = generatePlan(allMeals, { days: 4 })
    const b = generatePlan(allMeals, { days: 4 })
    expect(a).toEqual(b)
  })
})
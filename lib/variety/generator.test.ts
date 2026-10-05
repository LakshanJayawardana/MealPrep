import { describe, expect, it } from 'vitest'
import { generatePlan, scoreMeal } from './generator'
import { DEFAULT_WEIGHTS, type Meal } from './types'

// ---- Fixtures ----

const chickenCurry: Meal = {
  id: 'c1',
  name: 'Chicken Curry',
  role: 'curry',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: ['high-protein'],
  primaryIngredientIds: ['chicken'],
}

const dhalCurry: Meal = {
  id: 'c2',
  name: 'Dhal Curry',
  role: 'curry',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: ['vegetarian'],
  primaryIngredientIds: ['dhal'],
}

const brinjalCurry: Meal = {
  id: 'c3',
  name: 'Brinjal Curry',
  role: 'curry',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: ['vegetarian'],
  primaryIngredientIds: ['brinjal'],
}

const fishCurry: Meal = {
  id: 'c4',
  name: 'Fish Curry',
  role: 'curry',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: ['high-protein'],
  primaryIngredientIds: ['tuna'],
}

const redRice: Meal = {
  id: 'k1',
  name: 'Red Rice',
  role: 'carb',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: [],
  primaryIngredientIds: ['red-rice'],
}

const whiteRice: Meal = {
  id: 'k2',
  name: 'White Rice',
  role: 'carb',
  cuisine: 'sri-lankan',
  meal_type: 'lunch',
  tags: [],
  primaryIngredientIds: ['white-rice'],
}

const stringHoppers: Meal = {
  id: 'k3',
  name: 'String Hoppers',
  role: 'carb',
  cuisine: 'sri-lankan',
  meal_type: 'breakfast',
  tags: [],
  primaryIngredientIds: ['rice-flour'],
}

const eggHopper: Meal = {
  id: 'b1',
  name: 'Egg Hopper',
  role: 'breakfast',
  cuisine: 'sri-lankan',
  meal_type: 'breakfast',
  tags: [],
  primaryIngredientIds: ['egg'],
}

const kiribath: Meal = {
  id: 'b2',
  name: 'Kiribath',
  role: 'breakfast',
  cuisine: 'sri-lankan',
  meal_type: 'breakfast',
  tags: [],
  primaryIngredientIds: ['white-rice'],
}

const kottu: Meal = {
  id: 'd1',
  name: 'Kottu Roti',
  role: 'dish',
  cuisine: 'sri-lankan',
  meal_type: 'dinner',
  tags: [],
  primaryIngredientIds: ['kottu'],
}

const allMeals: Meal[] = [
  chickenCurry,
  dhalCurry,
  brinjalCurry,
  fishCurry,
  redRice,
  whiteRice,
  stringHoppers,
  eggHopper,
  kiribath,
  kottu,
]

// ---- scoreMeal tests ----

describe('scoreMeal', () => {
  it('gives a fresh meal the base score', () => {
    const result = scoreMeal(chickenCurry, [], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100)
  })

  it('penalizes exact repeats', () => {
    const result = scoreMeal(chickenCurry, [chickenCurry], DEFAULT_WEIGHTS)
    // repeat + ingredient + cuisine + tag all stack for identical meal
    const expected =
      100 -
      DEFAULT_WEIGHTS.repeat -
      DEFAULT_WEIGHTS.ingredient -
      DEFAULT_WEIGHTS.cuisine -
      DEFAULT_WEIGHTS.tag
    expect(result.score).toBe(expected)
  })

  it('penalizes shared primary ingredients in isolation', () => {
    const chickenWestern: Meal = {
      id: 'x1',
      name: 'Roast Chicken',
      role: 'dish',
      cuisine: 'western',
      meal_type: 'dinner',
      tags: [],
      primaryIngredientIds: ['chicken'],
    }
    const result = scoreMeal(chickenWestern, [chickenCurry], DEFAULT_WEIGHTS)
    expect(result.score).toBe(100 - DEFAULT_WEIGHTS.ingredient)
  })
})

// ---- generatePlan tests ----

describe('generatePlan — pairing', () => {
  it('produces curry + carb for each main slot', () => {
    const plan = generatePlan(allMeals, {
      days: 3,
      slots: ['lunch'],
    })
    expect(plan).toHaveLength(3)
    plan.forEach((day) => {
      expect(day.slots).toHaveLength(1)
      const slot = day.slots[0]
      expect(slot.slot).toBe('lunch')
      expect(slot.meals).toHaveLength(2) // curry + carb
      const roles = slot.meals.map((m) => m.role).sort()
      expect(roles).toEqual(['carb', 'curry'])
    })
  })

  it('handles breakfast — either standalone or carb + curry pair', () => {
  const plan = generatePlan(allMeals, {
    days: 3,
    slots: ['breakfast'],
  })
  expect(plan).toHaveLength(3)
  plan.forEach((day) => {
    expect(day.slots).toHaveLength(1)
    const slot = day.slots[0]
    expect(slot.slot).toBe('breakfast')
    // Either 1 meal (standalone breakfast) or 2 (carb + curry)
    expect([1, 2]).toContain(slot.meals.length)
    // Every meal in the slot must be breakfast-appropriate
    slot.meals.forEach((m) => {
      expect(m.meal_type).toBe('breakfast')
    })
  })
})

  it('handles mixed breakfast + lunch + dinner in one plan', () => {
  const plan = generatePlan(allMeals, { days: 2 })
  expect(plan).toHaveLength(2)
  plan.forEach((day) => {
    expect(day.slots).toHaveLength(3)
    // All three slots pair up: breakfast (carb + breakfast), lunch (carb + curry), dinner (carb + curry)
    const totals = day.slots.map((s) => s.meals.length)
    expect(totals).toEqual([2, 2, 2])

    // Verify breakfast slot contents
    const breakfastSlot = day.slots.find((s) => s.slot === 'breakfast')!
    breakfastSlot.meals.forEach((m) => {
      expect(m.meal_type).toBe('breakfast')
    })

    // Verify lunch and dinner slots are curry + carb
    const lunchSlot = day.slots.find((s) => s.slot === 'lunch')!
    const dinnerSlot = day.slots.find((s) => s.slot === 'dinner')!
    ;[lunchSlot, dinnerSlot].forEach((slot) => {
      const roles = slot.meals.map((m) => m.role).sort()
      expect(roles).toEqual(['carb', 'curry'])
    })
  })
})

  it('degrades gracefully if no carbs exist', () => {
    const noCarbs = allMeals.filter((m) => m.role !== 'carb')
    const plan = generatePlan(noCarbs, { days: 2, slots: ['lunch'] })
    plan.forEach((day) => {
      expect(day.slots[0].meals).toHaveLength(1)
      expect(day.slots[0].meals[0].role).toBe('curry')
    })
  })

  it('degrades gracefully if no curries exist', () => {
    const noCurries = allMeals.filter((m) => m.role !== 'curry')
    const plan = generatePlan(noCurries, { days: 2, slots: ['lunch'] })
    plan.forEach((day) => {
      expect(day.slots[0].meals).toHaveLength(1)
      expect(day.slots[0].meals[0].role).toBe('carb')
    })
  })
})

describe('generatePlan — variety', () => {
  it('rotates through curries before repeating', () => {
    const plan = generatePlan(allMeals, {
      days: 4,
      slots: ['lunch'],
      recentWindow: 10,
    })
    const curryIds = plan.map(
      (d) => d.slots[0].meals.find((m) => m.role === 'curry')!.id
    )
    expect(new Set(curryIds).size).toBe(4)
  })

  it('rotates through carbs before repeating', () => {
    const plan = generatePlan(allMeals, {
      days: 2,
      slots: ['lunch'],
      recentWindow: 10,
    })
    const carbIds = plan.map(
      (d) => d.slots[0].meals.find((m) => m.role === 'carb')!.id
    )
    expect(new Set(carbIds).size).toBe(2)
  })

  it('returns deterministic output', () => {
    const a = generatePlan(allMeals, { days: 4 })
    const b = generatePlan(allMeals, { days: 4 })
    expect(a).toEqual(b)
  })
})
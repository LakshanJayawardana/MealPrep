import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadMeals } from '@/lib/variety/loader'
import { scoreMeal } from '@/lib/variety/generator'
import { DEFAULT_WEIGHTS, type Meal } from '@/lib/variety/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const mealRowId = url.searchParams.get('mealRowId')
  if (!mealRowId) {
    return NextResponse.json({ error: 'mealRowId required' }, { status: 400 })
  }

  // Fetch the target planned_meal to get its role + current meal
  const { data: target, error: targetError } = await supabase
    .from('planned_meals')
    .select(
      `
      id,
      slot,
      meals!inner (id, name, role, meal_type)
    `
    )
    .eq('id', mealRowId)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: 'Planned meal not found' }, { status: 404 })
  }

  const targetMeal = Array.isArray(target.meals) ? target.meals[0] : target.meals
  if (!targetMeal) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
  }

  // Fetch all planned meals in this plan EXCEPT the target — used for scoring
  const { data: planMeals, error: planError } = await supabase
    .from('planned_meals')
    .select(
      `
      id,
      meals!inner (
        id, name, role, cuisine, meal_type, tags,
        meal_ingredients (ingredient_id, is_primary)
      ),
      planned_days!inner (plan_id)
    `
    )
    .eq('planned_days.plan_id', planId)
    .neq('id', mealRowId)

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 })
  }

  // Normalize context meals to the Meal shape
  const contextMeals: Meal[] = (planMeals ?? []).map((pm) => {
    const m = Array.isArray(pm.meals) ? pm.meals[0] : pm.meals
    return {
      id: m.id,
      name: m.name,
      role: m.role ?? 'dish',
      cuisine: m.cuisine,
      meal_type: m.meal_type,
      tags: m.tags ?? [],
      primaryIngredientIds: (m.meal_ingredients ?? [])
        .filter((mi: { is_primary: boolean }) => mi.is_primary)
        .map((mi: { ingredient_id: string }) => mi.ingredient_id),
    }
  })

  // Load all available meals the user can pick from
  const allMeals = await loadMeals(supabase, user.id, true)

  // Filter to same role + compatible meal_type
  const candidates = allMeals.filter(
    (m) =>
      m.id !== targetMeal.id && // exclude current
      m.role === targetMeal.role &&
      (m.meal_type === target.meal_type ||
        (m.role === 'curry' || m.role === 'carb') === false
          ? m.meal_type === target.meal_type
          : true)
  )

  // Simpler filter: same role AND (same meal_type OR flexible role)
  const filtered = allMeals.filter((m) => {
    if (m.id === targetMeal.id) return false
    if (m.role !== targetMeal.role) return false
    if (m.meal_type === target.meal_type) return true
    // Curries and carbs are flexible across lunch/dinner
    if (
      (m.role === 'curry' || m.role === 'carb') &&
      (target.meal_type === 'lunch' || target.meal_type === 'dinner')
    ) {
      return true
    }
    return false
  })

  // Score each candidate against the rest of the plan
  const scored = filtered.map((m) => {
    const scored = scoreMeal(m, contextMeals, DEFAULT_WEIGHTS)
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      cuisine: m.cuisine,
      meal_type: m.meal_type,
      tags: m.tags,
      score: scored.score,
      reasons: scored.reasons,
    }
  })

  scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({
    current: {
      id: targetMeal.id,
      name: targetMeal.name,
      role: targetMeal.role,
    },
    alternatives: scored.slice(0, 20), // top 20
  })
}
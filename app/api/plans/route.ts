import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePlan } from '@/lib/variety/generator'
import { loadMeals } from '@/lib/variety/loader'

type GeneratePayload = {
  startDate: string // 'YYYY-MM-DD'
  includeCatalog: boolean
  days?: number // default 7
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: GeneratePayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) {
    return NextResponse.json(
      { error: 'startDate must be YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const days = body.days ?? 7
  if (days < 1 || days > 31) {
    return NextResponse.json({ error: 'days must be 1–31' }, { status: 400 })
  }

  // 1. Load meals for the generator
  let meals
  try {
    meals = await loadMeals(supabase, user.id, body.includeCatalog)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load meals' },
      { status: 500 }
    )
  }

  if (meals.length === 0) {
    return NextResponse.json(
      {
        error:
          'No meals available. Create a meal or enable the catalog to generate a plan.',
      },
      { status: 400 }
    )
  }

  // 2. Run the generator
  const generated = generatePlan(meals, { days })

  // 3. Persist: meal_plan → planned_days → planned_meals
  const startDate = new Date(body.startDate + 'T00:00:00Z')
  const endDate = new Date(startDate)
  endDate.setUTCDate(endDate.getUTCDate() + days - 1)
  const endDateStr = endDate.toISOString().slice(0, 10)

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      name: `Week of ${body.startDate}`,
      start_date: body.startDate,
      end_date: endDateStr,
    })
    .select('id')
    .single()

  if (planError || !plan) {
    return NextResponse.json(
      { error: planError?.message ?? 'Failed to create plan' },
      { status: 500 }
    )
  }

  // Insert each day
  const dayRows = generated.map((day, index) => {
    const d = new Date(startDate)
    d.setUTCDate(d.getUTCDate() + index)
    return {
      plan_id: plan.id,
      day_date: d.toISOString().slice(0, 10),
    }
  })

  const { data: insertedDays, error: daysError } = await supabase
    .from('planned_days')
    .insert(dayRows)
    .select('id, day_date')

  if (daysError || !insertedDays) {
    await supabase.from('meal_plans').delete().eq('id', plan.id)
    return NextResponse.json(
      { error: daysError?.message ?? 'Failed to create plan days' },
      { status: 500 }
    )
  }

  // Match generated days to inserted days by index (both are in the same order)
  const mealRows = generated.flatMap((day, index) =>
    day.meals.map((meal, slotIndex) => ({
      planned_day_id: insertedDays[index].id,
      meal_id: meal.id,
      slot: meal.meal_type,
      position: slotIndex,
    }))
  )

  const { error: mealsError } = await supabase
    .from('planned_meals')
    .insert(mealRows)

  if (mealsError) {
    // Best-effort cleanup
    await supabase.from('meal_plans').delete().eq('id', plan.id)
    return NextResponse.json(
      { error: mealsError.message ?? 'Failed to create planned meals' },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: plan.id }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select('id, name, start_date, end_date, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plans: data ?? [] })
}
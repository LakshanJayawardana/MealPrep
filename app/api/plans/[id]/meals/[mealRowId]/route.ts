import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SwapPayload = {
  mealId: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mealRowId: string }> }
) {
  const { id: planId, mealRowId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SwapPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.mealId) {
    return NextResponse.json({ error: 'mealId is required' }, { status: 400 })
  }

  // Verify the planned_meal belongs to a plan owned by this user
  const { data: existing, error: lookupError } = await supabase
    .from('planned_meals')
    .select(
      `
      id,
      slot,
      planned_days!inner (
        plan_id,
        meal_plans!inner (user_id)
      )
    `
    )
    .eq('id', mealRowId)
    .single()

  if (lookupError || !existing) {
    return NextResponse.json({ error: 'Planned meal not found' }, { status: 404 })
  }

  // Type-narrow the joined data
  const plannedDay = Array.isArray(existing.planned_days)
    ? existing.planned_days[0]
    : existing.planned_days
  const plan = Array.isArray(plannedDay?.meal_plans)
    ? plannedDay?.meal_plans[0]
    : plannedDay?.meal_plans

  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  // Replace the meal
  const { error: updateError } = await supabase
    .from('planned_meals')
    .update({ meal_id: body.mealId })
    .eq('id', mealRowId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
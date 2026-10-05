import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .select(
      `
      id, name, start_date, end_date, created_at,
      planned_days (
        id, day_date,
        planned_meals (
          id, slot, position,
          meals (
            id, name, cuisine, meal_type, tags,
            meal_ingredients (is_primary, ingredient_id)
          )
        )
      )
    `
    )
    .eq('id', id)
    .single()

  if (planError || !plan) {
    return NextResponse.json(
      { error: planError?.message ?? 'Plan not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ plan })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.from('meal_plans').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
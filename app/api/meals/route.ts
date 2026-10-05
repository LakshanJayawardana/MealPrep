import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Payload = {
  name: string
  cuisine: string | null
  meal_type: string
  tags: string[]
  ingredients: {
    ingredient_id: string
    quantity: number
    unit: string
    is_primary: boolean
  }[]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Payload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Basic validation
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Meal name is required' }, { status: 400 })
  }
  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    return NextResponse.json({ error: 'At least one ingredient is required' }, { status: 400 })
  }

  // Insert meal
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      cuisine: body.cuisine,
      meal_type: body.meal_type,
      tags: body.tags,
    })
    .select('id')
    .single()

  if (mealError || !meal) {
    return NextResponse.json(
      { error: mealError?.message ?? 'Failed to create meal' },
      { status: 500 }
    )
  }

  // Insert meal_ingredients
  const links = body.ingredients.map((i) => ({
    meal_id: meal.id,
    ingredient_id: i.ingredient_id,
    quantity: i.quantity,
    unit: i.unit,
    is_primary: i.is_primary,
  }))

  const { error: linkError } = await supabase
    .from('meal_ingredients')
    .insert(links)

  if (linkError) {
    // Roll back the meal to avoid orphans
    await supabase.from('meals').delete().eq('id', meal.id)
    return NextResponse.json(
      { error: `Failed to save ingredients: ${linkError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: meal.id }, { status: 201 })
}
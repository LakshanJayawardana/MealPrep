import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MealForm } from '../MealForm'

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [ingredientsRes, mealRes] = await Promise.all([
    supabase
      .from('ingredients')
      .select('id, name, category, default_unit')
      .order('category')
      .order('name'),
    supabase
      .from('meals')
      .select(
        'id, name, role, cuisine, meal_type, tags, meal_ingredients(ingredient_id, quantity, unit, is_primary)'
      )
      .eq('id', id)
      .single(),
  ])

  if (mealRes.error || !mealRes.data) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/meals"
          className="text-sm text-stone-600 hover:underline"
        >
          ← Meals
        </Link>
        <h2 className="mt-2 text-xl font-bold">{mealRes.data.name}</h2>
      </div>
      <MealForm
        ingredients={ingredientsRes.data ?? []}
        meal={mealRes.data}
      />
    </div>
  )
}
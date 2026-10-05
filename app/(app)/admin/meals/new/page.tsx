import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MealForm } from '../MealForm'

export default async function NewMealPage() {
  const supabase = await createClient()

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, category, default_unit')
    .order('category')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/meals"
          className="text-sm text-stone-600 hover:underline"
        >
          ← Meals
        </Link>
        <h2 className="mt-2 text-xl font-bold">New meal</h2>
      </div>
      <MealForm ingredients={ingredients ?? []} />
    </div>
  )
}
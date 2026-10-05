import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MealForm } from './MealForm'

export default async function NewMealPage() {
  const supabase = await createClient()

  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('id, name, category, default_unit')
    .order('category')
    .order('name')

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        Failed to load ingredients: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/meals" className="text-sm text-gray-600 hover:underline">
          ← Back to meals
        </Link>
        <h1 className="text-2xl font-bold mt-2">New meal</h1>
        <p className="text-sm text-gray-600 mt-1">
          Add a meal with its ingredients. This will be available in your plan generation.
        </p>
      </div>

      <MealForm ingredients={ingredients ?? []} />
    </div>
  )
}
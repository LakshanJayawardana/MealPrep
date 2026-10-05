import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IngredientForm } from '../IngredientForm'

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ingredient, error } = await supabase
    .from('ingredients')
    .select('id, name, category, default_unit')
    .eq('id', id)
    .single()

  if (error || !ingredient) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ingredients"
          className="text-sm text-stone-600 hover:underline"
        >
          ← Ingredients
        </Link>
        <h2 className="mt-2 text-xl font-bold">{ingredient.name}</h2>
      </div>
      <IngredientForm ingredient={ingredient} />
    </div>
  )
}
import Link from 'next/link'
import { IngredientForm } from '../IngredientForm'

export default function NewIngredientPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ingredients"
          className="text-sm text-stone-600 hover:underline"
        >
          ← Ingredients
        </Link>
        <h2 className="mt-2 text-xl font-bold">New ingredient</h2>
      </div>
      <IngredientForm />
    </div>
  )
}
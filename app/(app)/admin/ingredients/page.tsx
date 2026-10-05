import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function IngredientsListPage() {
  const supabase = await createClient()

  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('id, name, category, default_unit')
    .order('category')
    .order('name')

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load ingredients: {error.message}
      </div>
    )
  }

  // Group by category
  const grouped = new Map<string, typeof ingredients>()
  for (const item of ingredients ?? []) {
    if (!grouped.has(item.category)) grouped.set(item.category, [])
    grouped.get(item.category)!.push(item)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">
          {ingredients?.length ?? 0} ingredient
          {ingredients?.length === 1 ? '' : 's'}
        </p>
        <Link href="/admin/ingredients/new" className="btn-primary">
          + New ingredient
        </Link>
      </div>

      {Array.from(grouped.entries()).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            {category}
          </h2>
          <ul className="card divide-y divide-stone-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/ingredients/${item.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-stone-50"
                >
                  <span className="text-sm font-medium text-stone-900">
                    {item.name}
                  </span>
                  <span className="text-xs text-stone-500">
                    {item.default_unit}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
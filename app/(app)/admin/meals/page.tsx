import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ROLE_ORDER = ['curry', 'carb', 'breakfast', 'dish', 'other']
const ROLE_LABELS: Record<string, string> = {
  curry: 'Curries',
  carb: 'Carbs',
  breakfast: 'Breakfasts',
  dish: 'One-dish meals',
  other: 'Other',
}

export default async function MealsListPage() {
  const supabase = await createClient()

  const { data: meals, error } = await supabase
    .from('meals')
    .select('id, name, role, cuisine, meal_type, user_id, meal_ingredients(count)')
    .order('role')
    .order('name')

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load meals: {error.message}
      </div>
    )
  }

  // Group by role
  const grouped = new Map<string, typeof meals>()
  for (const meal of meals ?? []) {
    const role = meal.role ?? 'other'
    if (!grouped.has(role)) grouped.set(role, [])
    grouped.get(role)!.push(meal)
  }

  // Sort roles by defined order, unknown roles at the end
  const sorted = Array.from(grouped.entries()).sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a[0])
    const bi = ROLE_ORDER.indexOf(b[0])
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600">
          {meals?.length ?? 0} meal{meals?.length === 1 ? '' : 's'} in catalog
        </p>
        <Link href="/admin/meals/new" className="btn-primary">
          + New meal
        </Link>
      </div>

      {sorted.map(([role, items]) => (
        <section key={role}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            {ROLE_LABELS[role] ?? role} ({items.length})
          </h2>
          <ul className="card divide-y divide-stone-100">
            {items.map((meal) => {
              const isSystem = meal.user_id === null
              return (
                <li key={meal.id}>
                  <Link
                    href={`/admin/meals/${meal.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-stone-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-stone-900">
                          {meal.name}
                        </span>
                        {!isSystem && (
                          <span className="pill shrink-0 bg-accent-50 text-accent-800">
                            User
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {meal.meal_type}
                        {meal.cuisine && ` · ${meal.cuisine}`}
                        {` · ${meal.meal_ingredients?.[0]?.count ?? 0} ingredients`}
                      </p>
                    </div>
                    <span className="text-sm text-stone-400">→</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {sorted.length === 0 && (
        <div className="card px-6 py-16 text-center">
          <p className="text-stone-600">No meals in the catalog yet.</p>
          <Link href="/admin/meals/new" className="btn-primary mt-4 inline-flex">
            Add the first one
          </Link>
        </div>
      )}
    </div>
  )
}
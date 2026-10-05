import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MealCard } from '@/components/MealCard'

type SearchParams = { filter?: string }

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('meals')
    .select('id, name, role, cuisine, meal_type, tags, user_id, meal_ingredients(count)')
    .order('name')

  if (filter === 'system') {
    query = query.is('user_id', null)
  } else if (filter === 'mine') {
    query = query.eq('user_id', user!.id)
  } else {
    query = query.or(`user_id.is.null,user_id.eq.${user!.id}`)
  }

  const { data: meals, error } = await query

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load meals: {error.message}
      </div>
    )
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'system', label: 'Catalog' },
    { key: 'mine', label: 'Mine' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Meals</h1>
          <p className="mt-1 text-sm text-stone-600">
            {meals?.length ?? 0} meal{meals?.length === 1 ? '' : 's'} available
          </p>
        </div>
        <Link href="/meals/new" className="btn-primary">
          + New meal
        </Link>
      </div>

      <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
        {tabs.map((t) => {
          const active = filter === t.key
          return (
            <Link
              key={t.key}
              href={`/meals?filter=${t.key}`}
              className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {meals && meals.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {meals.map((m) => (
            <MealCard
              key={m.id}
              meal={{
  id: m.id,
  name: m.name,
  role: m.role,
  cuisine: m.cuisine,
  meal_type: m.meal_type,
  tags: m.tags,
  user_id: m.user_id,
  ingredient_count: m.meal_ingredients?.[0]?.count ?? 0,
}}
            />
          ))}
        </div>
      ) : (
        <div className="card px-6 py-16 text-center">
          <p className="text-stone-600">No meals in this view.</p>
          <Link
            href="/meals/new"
            className="btn-primary mt-4 inline-flex"
          >
            Add your first meal
          </Link>
        </div>
      )}
    </div>
  )
}
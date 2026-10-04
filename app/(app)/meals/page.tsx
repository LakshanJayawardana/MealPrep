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

  // Base query: system catalog (user_id null) OR this user's meals
  let query = supabase
    .from('meals')
    .select('id, name, cuisine, meal_type, tags, user_id, meal_ingredients(count)')
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
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meals</h1>
          <p className="text-sm text-gray-600 mt-1">
            {meals?.length ?? 0} meal{meals?.length === 1 ? '' : 's'} available
          </p>
        </div>
        <Link
          href="/meals/new"
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          + New meal
        </Link>
      </div>

      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/meals?filter=${t.key}`}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${
              filter === t.key
                ? 'border-black font-medium'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {meals && meals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((m) => (
            <MealCard
              key={m.id}
              meal={{
                id: m.id,
                name: m.name,
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
        <div className="text-center py-16 text-gray-500">
          <p>No meals in this view.</p>
          <Link href="/meals/new" className="underline mt-2 inline-block">
            Add your first meal
          </Link>
        </div>
      )}
    </div>
  )
}
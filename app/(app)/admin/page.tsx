import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminHome() {
  const supabase = await createClient()

  const [ingredients, meals] = await Promise.all([
    supabase.from('ingredients').select('*', { count: 'exact', head: true }),
    supabase.from('meals').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AdminCard
        href="/admin/ingredients"
        title="Ingredients"
        count={ingredients.count ?? 0}
        description="The raw items you buy and cook with"
      />
      <AdminCard
        href="/admin/meals"
        title="Meals"
        count={meals.count ?? 0}
        description="Curries, carbs, breakfasts, and dishes"
      />
    </div>
  )
}

function AdminCard({
  href,
  title,
  count,
  description,
}: {
  href: string
  title: string
  count: number
  description: string
}) {
  return (
    <Link
      href={href}
      className="card p-5 transition-colors hover:border-stone-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-stone-900">{title}</p>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-stone-300">
          {count}
        </span>
      </div>
      <p className="mt-4 text-sm text-brand-700">Manage →</p>
    </Link>
  )
}
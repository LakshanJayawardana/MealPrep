import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count: mealCount } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.is.null,user_id.eq.${user!.id}`)

  const { count: planCount } = await supabase
    .from('meal_plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as {user!.email}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Meals available" value={mealCount ?? 0} />
        <StatCard label="Plans created" value={planCount ?? 0} />
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ActionCard
          href="/meals"
          title="Browse meals"
          description="See the catalog and your custom meals"
        />
        <ActionCard
          href="/plans"
          title="Generate a plan"
          description="Create a 7-day menu with variety"
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors active:bg-gray-50 sm:p-5 sm:hover:border-gray-400"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <p className="mt-3 text-sm text-gray-400 transition-transform group-hover:translate-x-0.5">
        →
      </p>
    </Link>
  )
}
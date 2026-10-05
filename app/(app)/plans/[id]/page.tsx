import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanDay } from '@/components/PlanDay'

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: plan, error } = await supabase
    .from('meal_plans')
    .select(
      `
      id, name, start_date, end_date,
      planned_days (
        id, day_date,
        planned_meals (
          id, slot, position,
          meals (
            id, name, role, cuisine, meal_type, tags
          )
        )
      )
    `
    )
    .eq('id', id)
    .order('day_date', { foreignTable: 'planned_days' })
    .single()

  if (error || !plan) notFound()

  // Sort days client-side (belt-and-suspenders, foreignTable order sometimes flaky)
  const sortedDays = [...plan.planned_days].sort((a, b) =>
    a.day_date.localeCompare(b.day_date)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/plans"
            className="text-sm text-stone-600 hover:underline"
          >
            ← All plans
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
            {plan.name}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {plan.start_date} → {plan.end_date}
          </p>
        </div>

        <Link
          href={`/plans/${id}/shopping`}
          className="btn-primary"
        >
          Shopping list
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sortedDays.map((day) => {
          // The nested `meals` can come back as an array or object depending
          // on Supabase's inference. Normalize to a single object.
          const normalizedDay = {
            id: day.id,
            day_date: day.day_date,
            planned_meals: (day.planned_meals ?? []).map((pm) => ({
              id: pm.id,
              slot: pm.slot,
              position: pm.position,
              meals: Array.isArray(pm.meals) ? pm.meals[0] : pm.meals,
            })),
          }

          return <PlanDay key={day.id} day={normalizedDay} />
        })}
      </div>
    </div>
  )
}
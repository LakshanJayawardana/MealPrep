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
            id, name, cuisine, meal_type, tags
          )
        )
      )
    `
    )
    .eq('id', id)
    .order('day_date', { foreignTable: 'planned_days' })
    .order('position', { foreignTable: 'planned_days.planned_meals' })
    .single()

  if (error || !plan) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plans" className="text-sm text-gray-600 hover:underline">
          ← All plans
        </Link>
        <h1 className="text-2xl font-bold mt-2">{plan.name}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {plan.start_date} → {plan.end_date}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plan.planned_days.map((day) => (
  <PlanDay
    key={day.id}
    day={{
      id: day.id,
      day_date: day.day_date,
      planned_meals: (day.planned_meals ?? []).map((pm) => ({
        id: pm.id,
        slot: pm.slot,
        position: pm.position,
        meals: Array.isArray(pm.meals) ? pm.meals[0] : pm.meals,
      })),
    }}
  />
))}
      </div>
    </div>
  )
}
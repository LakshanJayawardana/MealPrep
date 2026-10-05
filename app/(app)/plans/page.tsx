import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GeneratePlanForm } from './GeneratePlanForm'

export default async function PlansPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from('meal_plans')
    .select('id, name, start_date, end_date, created_at')
    .eq('user_id', user!.id)
    .order('start_date', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate a 7-day plan, or review your existing ones.
        </p>
      </div>

      <GeneratePlanForm />

      <div className="space-y-3">
        <h2 className="font-medium">Your plans</h2>

        {plans && plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/plans/${p.id}`}
                className="block bg-white border rounded-lg p-4 hover:border-gray-400"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.start_date} → {p.end_date}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
            <p>No plans yet.</p>
            <p className="text-sm mt-1">
              Generate your first one above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
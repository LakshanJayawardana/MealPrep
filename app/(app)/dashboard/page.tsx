import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, created_at')
    .eq('id', user!.id)
    .single()

  const { count: mealCount } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-medium">{user!.email}</p>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <p className="text-sm text-gray-500">Meals available</p>
          <p className="font-medium">{mealCount ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <a
          href="/meals"
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          Browse meals
        </a>
        <a
          href="/plans"
          className="border px-4 py-2 rounded text-sm bg-white"
        >
          View plans
        </a>
      </div>
    </div>
  )
}
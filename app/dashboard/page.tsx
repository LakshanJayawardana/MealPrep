import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action="/logout" method="post">
          <button className="text-sm underline">Log out</button>
        </form>
      </div>

      <div className="rounded border p-4 space-y-2">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Profile created:</strong> {profile?.created_at ?? 'missing'}</p>
        <p>
          <strong>Trigger check:</strong>{' '}
          {profile ? '✅ profile row exists' : '❌ no profile row (trigger failed)'}
        </p>
      </div>
    </div>
  )
}
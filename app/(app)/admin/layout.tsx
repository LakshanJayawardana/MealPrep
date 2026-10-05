import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Admin
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage the system catalog
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-stone-600 hover:underline"
          >
            ← Back to app
          </Link>
        </div>

        <nav className="mt-4 flex gap-1">
          <AdminTab href="/admin" label="Overview" />
          <AdminTab href="/admin/ingredients" label="Ingredients" />
          <AdminTab href="/admin/meals" label="Meals" />
        </nav>
      </div>

      {children}
    </div>
  )
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
    >
      {label}
    </Link>
  )
}
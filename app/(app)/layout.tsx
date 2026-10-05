import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default async function AppLayout({
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

  const isAdmin = profile?.is_admin ?? false
  const t = await getTranslations('App')

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-stone-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              M
            </span>
            {t('brand')}
          </Link>

          <nav className="hidden gap-6 text-sm md:flex">
            <Link
              href="/dashboard"
              className="text-stone-600 transition-colors hover:text-stone-900"
            >
              {t('navDashboard')}
            </Link>
            <Link
              href="/meals"
              className="text-stone-600 transition-colors hover:text-stone-900"
            >
              {t('navMeals')}
            </Link>
            <Link
              href="/plans"
              className="text-stone-600 transition-colors hover:text-stone-900"
            >
              {t('navPlans')}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="font-medium text-accent-700 transition-colors hover:text-accent-900"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm text-stone-500 sm:inline">
              {user.email}
            </span>
            <form action="/logout" method="post">
              <button className="text-sm font-medium text-stone-600 underline-offset-2 transition-colors hover:text-stone-900 hover:underline">
                {t('logOut')}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-safe-nav md:pb-12">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur pb-safe md:hidden">
        <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <BottomNavLink href="/dashboard" label={t('navDashboard')} icon="🏠" />
          <BottomNavLink href="/meals" label={t('navMeals')} icon="🍽" />
          <BottomNavLink href="/plans" label={t('navPlans')} icon="📅" />
          {isAdmin && (
            <BottomNavLink href="/admin" label="Admin" icon="⚙️" />
          )}
        </div>
      </nav>
    </div>
  )
}

function BottomNavLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-stone-600 transition-colors active:bg-stone-100"
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
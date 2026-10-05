'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { COOKIE_NAME, type Locale } from '@/i18n/config'


export function LanguageSwitcher() {
  const t = useTranslations('Language')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function switchLocale(next: Locale) {
    if (next === locale) return

    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-0.5 text-xs">
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          locale === 'en'
            ? 'bg-brand-600 text-white'
            : 'text-stone-600 hover:bg-stone-100'
        } disabled:opacity-50`}
      >
        {t('english')}
      </button>
      <button
        onClick={() => switchLocale('si')}
        disabled={isPending}
        className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
          locale === 'si'
            ? 'bg-brand-600 text-white'
            : 'text-stone-600 hover:bg-stone-100'
        } disabled:opacity-50`}
      >
        {t('sinhala')}
      </button>
    </div>
  )
}
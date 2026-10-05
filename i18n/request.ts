import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, COOKIE_NAME, type Locale } from './config'

// Re-export so existing imports from '@/i18n/request' keep working
export { locales, defaultLocale, COOKIE_NAME, type Locale }

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(COOKIE_NAME)?.value

  const locale: Locale = (locales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
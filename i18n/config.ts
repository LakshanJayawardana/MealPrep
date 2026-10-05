export const locales = ['en', 'si'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const COOKIE_NAME = 'NEXT_LOCALE'
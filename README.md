# MealPrep

A meal planning app for weekly and monthly meal prep, with a focus
on Sri Lankan rice-and-curry cooking.

## Features (working)

- Email/password auth
- Meal catalog (system + user-created)
- Variety-aware 7-day plan generator
- Curry + carb pairing per slot
- Shopping list (aggregated ingredients, no pricing)
- Swap individual meals in a plan
- Admin CRUD for ingredients and meals
- English + Sinhala i18n (partial)

## Features (planned, deferred)

- Price tracking and budget forecast (paid tier)
- Ingredient creation for regular users
- Meal editing/deletion for regular users
- Meal detail pages
- Toast notifications, loading skeletons
- Full i18n migration
- Mobile polish pass

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript, Tailwind CSS v4
- Supabase (Postgres, Auth, RLS)
- next-intl (i18n)
- Vitest (unit tests)

## Local setup

1. Clone the repo
2. `npm install`
3. Create `.env.local` with:
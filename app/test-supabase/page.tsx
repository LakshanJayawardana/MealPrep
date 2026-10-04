import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data: meals, error } = await supabase
    .from('meals')
    .select('name, cuisine, meal_type, tags')
    .order('name')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Seeded meals</h1>
      {error && <pre className="text-red-600">{error.message}</pre>}
      <ul className="mt-4 space-y-1">
        {meals?.map(m => (
          <li key={m.name}>
            <strong>{m.name}</strong> — {m.cuisine} / {m.meal_type} / {m.tags?.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
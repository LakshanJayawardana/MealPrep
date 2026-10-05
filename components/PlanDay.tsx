type PlannedMeal = {
  id: string
  slot: string
  position: number
  meals: {
    id: string
    name: string
    cuisine: string | null
    meal_type: string
    tags: string[] | null
  }
}

type PlannedDay = {
  id: string
  day_date: string
  planned_meals: PlannedMeal[]
}

export function PlanDay({ day }: { day: PlannedDay }) {
  const date = new Date(day.day_date + 'T00:00:00Z')
  const dayName = date.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  })
  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  const meals = [...day.planned_meals].sort((a, b) => a.position - b.position)

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-stone-900">{dayName}</h3>
        <span className="text-xs text-stone-500">{dateLabel}</span>
      </div>

      <div className="mt-3 space-y-2">
        {meals.map((pm) => (
          <div
            key={pm.id}
            className="flex items-start gap-3 border-l-2 border-brand-200 pl-3 py-1"
          >
            <span className="w-16 shrink-0 pt-0.5 text-xs font-medium uppercase text-stone-400">
              {pm.slot}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight text-stone-900">
                {pm.meals.name}
              </p>
              {pm.meals.cuisine && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {pm.meals.cuisine}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
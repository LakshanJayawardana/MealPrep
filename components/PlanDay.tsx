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
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{dayName}</h3>
        <span className="text-xs text-gray-500">{dateLabel}</span>
      </div>

      <div className="space-y-2">
        {meals.map((pm) => (
          <div
            key={pm.id}
            className="flex items-start gap-3 border-l-2 border-gray-200 pl-3 py-1"
          >
            <span className="text-xs uppercase text-gray-400 w-16 pt-0.5">
              {pm.slot}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {pm.meals.name}
              </p>
              {pm.meals.cuisine && (
                <p className="text-xs text-gray-500 mt-0.5">
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
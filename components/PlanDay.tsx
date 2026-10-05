type PlannedMeal = {
  id: string
  slot: string
  position: number
  meals: {
    id: string
    name: string
    role: string | null
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

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
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

  // Group meals by slot
  const bySlot = new Map<string, PlannedMeal[]>()
  for (const pm of day.planned_meals) {
    if (!bySlot.has(pm.slot)) bySlot.set(pm.slot, [])
    bySlot.get(pm.slot)!.push(pm)
  }

  // Sort slots and meals within each slot
  const sortedSlots = Array.from(bySlot.entries()).sort((a, b) => {
    const ai = SLOT_ORDER.indexOf(a[0])
    const bi = SLOT_ORDER.indexOf(b[0])
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-stone-900">{dayName}</h3>
        <span className="text-xs text-stone-500">{dateLabel}</span>
      </div>

      <div className="mt-3 space-y-3">
        {sortedSlots.map(([slot, meals]) => (
          <SlotBlock key={slot} slot={slot} meals={meals} />
        ))}

        {sortedSlots.length === 0 && (
          <p className="text-sm text-stone-500">No meals planned.</p>
        )}
      </div>
    </div>
  )
}

function SlotBlock({ slot, meals }: { slot: string; meals: PlannedMeal[] }) {
  // Sort meals by position
  const sorted = [...meals].sort((a, b) => a.position - b.position)

  // A "pair" is a curry + carb. A "single" is anything alone.
  const isPair = sorted.length >= 2

  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {SLOT_LABELS[slot] ?? slot}
      </p>

      {isPair ? (
        // Pair rendering — main dish prominent, sides smaller
        <div className="mt-1.5 space-y-0.5">
          {sorted.map((pm, index) => (
            <p
              key={pm.id}
              className={
                index === 0
                  ? 'text-sm font-medium leading-tight text-stone-900'
                  : 'text-sm leading-tight text-stone-600'
              }
            >
              {pm.meals.name}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-medium leading-tight text-stone-900">
          {sorted[0]?.meals.name ?? '—'}
        </p>
      )}
    </div>
  )
}
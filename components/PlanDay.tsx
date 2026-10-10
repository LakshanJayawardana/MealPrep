'use client'

import { useState } from 'react'
import { SwapMealDialog } from './SwapMealDialog'

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

type SwapTarget = {
  mealRowId: string
  currentName: string
}

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function PlanDay({
  day,
  planId,
}: {
  day: PlannedDay
  planId: string
}) {
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null)

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

  const bySlot = new Map<string, PlannedMeal[]>()
  for (const pm of day.planned_meals) {
    if (!bySlot.has(pm.slot)) bySlot.set(pm.slot, [])
    bySlot.get(pm.slot)!.push(pm)
  }

  const sortedSlots = Array.from(bySlot.entries()).sort((a, b) => {
    const ai = SLOT_ORDER.indexOf(a[0])
    const bi = SLOT_ORDER.indexOf(b[0])
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <>
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-stone-900">{dayName}</h3>
          <span className="text-xs text-stone-500">{dateLabel}</span>
        </div>

        <div className="mt-3 space-y-3">
          {sortedSlots.map(([slot, meals]) => (
            <SlotBlock
              key={slot}
              slot={slot}
              meals={meals}
              onSwap={(rowId, name) =>
                setSwapTarget({ mealRowId: rowId, currentName: name })
              }
            />
          ))}

          {sortedSlots.length === 0 && (
            <p className="text-sm text-stone-500">No meals planned.</p>
          )}
        </div>
      </div>

      {swapTarget && (
        <SwapMealDialog
          planId={planId}
          mealRowId={swapTarget.mealRowId}
          currentName={swapTarget.currentName}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </>
  )
}

function SlotBlock({
  slot,
  meals,
  onSwap,
}: {
  slot: string
  meals: PlannedMeal[]
  onSwap: (rowId: string, name: string) => void
}) {
  const sorted = [...meals].sort((a, b) => a.position - b.position)

  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {SLOT_LABELS[slot] ?? slot}
      </p>

      <ul className="mt-1.5 space-y-0.5">
        {sorted.map((pm, index) => (
          <li key={pm.id} className="group flex items-center justify-between gap-2">
            <p
              className={
                index === 0
                  ? 'text-sm font-medium leading-tight text-stone-900'
                  : 'text-sm leading-tight text-stone-600'
              }
            >
              {pm.meals.name}
            </p>
            <button
              onClick={() => onSwap(pm.id, pm.meals.name)}
              className="shrink-0 rounded p-1 text-stone-400 transition-colors hover:bg-white hover:text-stone-900"
              aria-label="Swap this meal"
              title="Swap"
            >
              ↻
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
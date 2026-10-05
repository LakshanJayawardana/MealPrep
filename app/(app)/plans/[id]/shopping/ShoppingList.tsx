'use client'

import { useMemo, useState } from 'react'

type ShoppingItem = {
  ingredient_id: string
  ingredient_name: string
  ingredient_category: string
  default_unit: string
  total_quantity: number
}

const CATEGORY_ORDER = ['protein', 'carb', 'veg', 'dairy', 'other', 'spice']
const CATEGORY_LABELS: Record<string, string> = {
  protein: 'Proteins',
  carb: 'Carbs & grains',
  veg: 'Vegetables',
  dairy: 'Dairy',
  other: 'Other',
  spice: 'Spices',
}

export function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>()
    for (const item of items) {
      const cat = item.ingredient_category ?? 'other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return Array.from(map.entries()).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a[0])
      const bi = CATEGORY_ORDER.indexOf(b[0])
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [items])

  const totalItems = items.length
  const checkedCount = checked.size

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        <p className="font-medium">No ingredients found</p>
        <p className="mt-1 text-sm">
          This plan&apos;s meals don&apos;t have ingredients linked yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-gray-200 bg-gray-50/80 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Shopping progress
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">
              {checkedCount} of {totalItems}
            </p>
          </div>
          {checkedCount > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="text-sm text-gray-600 underline hover:text-black"
            >
              Reset
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-black transition-all duration-200"
            style={{
              width: totalItems === 0 ? '0%' : `${(checkedCount / totalItems) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Grouped items */}
      {grouped.map(([category, categoryItems]) => (
        <section key={category}>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {categoryItems.map((item) => {
              const isChecked = checked.has(item.ingredient_id)
              return (
                <li key={item.ingredient_id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors active:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(item.ingredient_id)}
                      className="h-5 w-5 shrink-0 rounded border-gray-300 accent-black"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-base transition-colors ${
                          isChecked
                            ? 'text-gray-400 line-through'
                            : 'font-medium text-gray-900'
                        }`}
                      >
                        {item.ingredient_name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        isChecked ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {formatQuantity(item.total_quantity)} {item.default_unit}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function formatQuantity(value: number): string {
  return Number(value.toFixed(1)).toString()
}
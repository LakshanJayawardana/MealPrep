'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Ingredient = {
  id: string
  name: string
  category: string
  default_unit: string
}

type IngredientRow = {
  rowId: string          // local key, not persisted
  ingredientId: string
  quantity: string       // keep as string in state, parse on submit
  isPrimary: boolean
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

export function MealForm({ ingredients }: { ingredients: Ingredient[] }) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState<string>('lunch')
  const [tagsInput, setTagsInput] = useState('')
  const [rows, setRows] = useState<IngredientRow[]>([
    { rowId: crypto.randomUUID(), ingredientId: '', quantity: '', isPrimary: false },
  ])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ---- Row management ----

  function addRow() {
    setRows((prev) => [
      ...prev,
      { rowId: crypto.randomUUID(), ingredientId: '', quantity: '', isPrimary: false },
    ])
  }

  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId))
  }

  function updateRow(rowId: string, patch: Partial<IngredientRow>) {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))
    )
  }

  function setPrimary(rowId: string, checked: boolean) {
    // Only one row can be primary
    setRows((prev) =>
      prev.map((r) => ({ ...r, isPrimary: r.rowId === rowId ? checked : false }))
    )
  }

  // ---- Helpers ----

  function ingredientById(id: string): Ingredient | undefined {
    return ingredients.find((i) => i.id === id)
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  }

  // ---- Submit ----

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Meal name is required.')
      return
    }

    // Validate rows: must have at least one with ingredient + quantity
    const validRows = rows.filter((r) => r.ingredientId && r.quantity.trim())

    if (validRows.length === 0) {
      setError('Add at least one ingredient with a quantity.')
      return
    }

    // Check for duplicate ingredients
    const ids = validRows.map((r) => r.ingredientId)
    if (new Set(ids).size !== ids.length) {
      setError('Each ingredient can only appear once.')
      return
    }

    // Check exactly one primary
    const primaryCount = validRows.filter((r) => r.isPrimary).length
    if (primaryCount === 0) {
      setError('Mark exactly one ingredient as the primary ingredient.')
      return
    }

    setSubmitting(true)

    const payload = {
      name: name.trim(),
      cuisine: cuisine.trim() || null,
      meal_type: mealType,
      tags: parseTags(tagsInput),
      ingredients: validRows.map((r) => ({
        ingredient_id: r.ingredientId,
        quantity: Number(r.quantity),
        unit: ingredientById(r.ingredientId)?.default_unit ?? 'g',
        is_primary: r.isPrimary,
      })),
    }

    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to create meal.')
      setSubmitting(false)
      return
    }

    router.push('/meals?filter=mine')
    router.refresh()
  }

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-lg p-6">
      {/* Basic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Meal name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grilled Chicken Bowl"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. italian"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Meal type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Tags <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="high-protein, quick, vegetarian"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Ingredient rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Ingredients</h2>
          <button
            type="button"
            onClick={addRow}
            className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
          >
            + Add ingredient
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const ing = ingredientById(row.ingredientId)
            return (
              <div
                key={row.rowId}
                className="grid grid-cols-12 gap-2 items-center"
              >
                {/* Ingredient select */}
                <div className="col-span-5">
                  <select
                    value={row.ingredientId}
                    onChange={(e) =>
                      updateRow(row.rowId, { ingredientId: e.target.value })
                    }
                    className="w-full border rounded px-2 py-2 text-sm"
                  >
                    <option value="">Select ingredient…</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.rowId, { quantity: e.target.value })
                    }
                    placeholder="Qty"
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                {/* Unit (read-only, from ingredient) */}
                <div className="col-span-2">
                  <input
                    type="text"
                    value={ing?.default_unit ?? ''}
                    readOnly
                    className="w-full border rounded px-2 py-2 text-sm bg-gray-50 text-gray-600"
                  />
                </div>

                {/* Primary checkbox */}
                <div className="col-span-1 flex justify-center">
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.isPrimary}
                      onChange={(e) => setPrimary(row.rowId, e.target.checked)}
                    />
                    ★
                  </label>
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    disabled={rows.length === 1}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-500">
          Mark exactly one ingredient with ★ as the primary ingredient — this powers the variety engine.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save meal'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/meals')}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
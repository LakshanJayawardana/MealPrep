'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Ingredient = {
  id: string
  name: string
  category: string
  default_unit: string
}

type IngredientRow = {
  rowId: string
  ingredientId: string
  quantity: string
  isPrimary: boolean
}

type ExistingMeal = {
  id: string
  name: string
  role: string
  cuisine: string | null
  meal_type: string
  tags: string[] | null
  meal_ingredients: {
    ingredient_id: string
    quantity: number
    unit: string
    is_primary: boolean
  }[]
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const ROLES = ['curry', 'carb', 'breakfast', 'dish', 'other'] as const

export function MealForm({
  ingredients,
  meal,
}: {
  ingredients: Ingredient[]
  meal?: ExistingMeal
}) {
  const router = useRouter()
  const isEdit = Boolean(meal?.id)

  const [name, setName] = useState(meal?.name ?? '')
  const [role, setRole] = useState(meal?.role ?? 'curry')
  const [cuisine, setCuisine] = useState(meal?.cuisine ?? 'sri-lankan')
  const [mealType, setMealType] = useState(meal?.meal_type ?? 'lunch')
  const [tagsInput, setTagsInput] = useState((meal?.tags ?? []).join(', '))

  const [rows, setRows] = useState<IngredientRow[]>(() => {
    if (meal?.meal_ingredients && meal.meal_ingredients.length > 0) {
      return meal.meal_ingredients.map((mi) => ({
        rowId: crypto.randomUUID(),
        ingredientId: mi.ingredient_id,
        quantity: String(mi.quantity),
        isPrimary: mi.is_primary,
      }))
    }
    return [
      {
        rowId: crypto.randomUUID(),
        ingredientId: '',
        quantity: '',
        isPrimary: false,
      },
    ]
  })

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        rowId: crypto.randomUUID(),
        ingredientId: '',
        quantity: '',
        isPrimary: false,
      },
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
    setRows((prev) =>
      prev.map((r) => ({ ...r, isPrimary: r.rowId === rowId ? checked : false }))
    )
  }

  function ingredientById(id: string) {
    return ingredients.find((i) => i.id === id)
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    const validRows = rows.filter((r) => r.ingredientId && r.quantity.trim())

    if (validRows.length === 0) {
      setError('Add at least one ingredient with a quantity.')
      return
    }

    const ids = validRows.map((r) => r.ingredientId)
    if (new Set(ids).size !== ids.length) {
      setError('Each ingredient can only appear once.')
      return
    }

    const primaryCount = validRows.filter((r) => r.isPrimary).length
    if (primaryCount === 0) {
      setError('Mark exactly one ingredient as the primary ingredient.')
      return
    }
    if (primaryCount > 1) {
      setError('Only one ingredient can be primary.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const mealPayload = {
      name: name.trim(),
      role,
      cuisine: cuisine.trim() || null,
      meal_type: mealType,
      tags: parseTags(tagsInput),
      // Admin form always writes system-catalog meals
      user_id: null,
    }

    let mealId = meal?.id

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('meals')
        .update(mealPayload)
        .eq('id', mealId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      // Delete existing links, then re-insert
      const { error: deleteError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', mealId)

      if (deleteError) {
        setError(`Failed to update ingredients: ${deleteError.message}`)
        setSaving(false)
        return
      }
    } else {
      const { data: created, error: createError } = await supabase
        .from('meals')
        .insert(mealPayload)
        .select('id')
        .single()

      if (createError || !created) {
        setError(createError?.message ?? 'Failed to create meal')
        setSaving(false)
        return
      }
      mealId = created.id
    }

    // Insert ingredient links
    const links = validRows.map((r) => ({
      meal_id: mealId!,
      ingredient_id: r.ingredientId,
      quantity: Number(r.quantity),
      unit: ingredientById(r.ingredientId)?.default_unit ?? 'g',
      is_primary: r.isPrimary,
    }))

    const { error: linkError } = await supabase
      .from('meal_ingredients')
      .insert(links)

    if (linkError) {
      setError(`Failed to save ingredients: ${linkError.message}`)
      setSaving(false)
      return
    }

    router.push('/admin/meals')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm(`Delete "${meal!.name}"? This cannot be undone.`)) return

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('meals').delete().eq('id', meal!.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/admin/meals')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {/* Basic fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken Curry"
            className="input"
          />
        </div>

        <div>
          <label className="label">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">
            Curries and carbs are paired by the generator.
          </p>
        </div>

        <div>
          <label className="label">Meal type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="input"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. sri-lankan"
            className="input"
          />
        </div>

        <div>
          <label className="label">
            Tags <span className="text-stone-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="high-protein, traditional"
            className="input"
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
            className="btn-secondary text-sm"
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
                className="grid grid-cols-12 items-center gap-2"
              >
                <div className="col-span-5">
                  <select
                    value={row.ingredientId}
                    onChange={(e) =>
                      updateRow(row.rowId, { ingredientId: e.target.value })
                    }
                    className="input text-sm"
                  >
                    <option value="">Select ingredient…</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.category})
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="input text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    value={ing?.default_unit ?? ''}
                    readOnly
                    className="input bg-stone-50 text-sm text-stone-600"
                  />
                </div>

                <div className="col-span-1 flex justify-center">
                  <label
                    className="flex cursor-pointer items-center gap-1 text-xs"
                    title="Mark as primary ingredient"
                  >
                    <input
                      type="checkbox"
                      checked={row.isPrimary}
                      onChange={(e) => setPrimary(row.rowId, e.target.checked)}
                    />
                    ★
                  </label>
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    disabled={rows.length === 1}
                    className="text-stone-400 transition-colors hover:text-red-600 disabled:opacity-30"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-stone-500">
          The ★ primary ingredient drives variety detection. Mark the dish&apos;s
          defining component (chicken, dhal, brinjal, etc.).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create meal'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/meals')}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="text-sm text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
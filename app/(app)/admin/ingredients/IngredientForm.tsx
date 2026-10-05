'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['protein', 'carb', 'veg', 'dairy', 'spice', 'other']
const UNITS = ['g', 'ml', 'count']

type Ingredient = {
  id?: string
  name: string
  category: string
  default_unit: string
}

export function IngredientForm({ ingredient }: { ingredient?: Ingredient }) {
  const router = useRouter()
  const isEdit = Boolean(ingredient?.id)

  const [name, setName] = useState(ingredient?.name ?? '')
  const [category, setCategory] = useState(ingredient?.category ?? 'protein')
  const [unit, setUnit] = useState(ingredient?.default_unit ?? 'g')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const payload = {
      name: name.trim(),
      category,
      default_unit: unit,
    }

    const { error } = isEdit
      ? await supabase
          .from('ingredients')
          .update(payload)
          .eq('id', ingredient!.id)
      : await supabase.from('ingredients').insert(payload)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/admin/ingredients')
    router.refresh()
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm(`Delete "${ingredient!.name}"? This cannot be undone.`)) return

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', ingredient!.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/admin/ingredients')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coconut milk"
          className="input"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Default unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ingredient'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/ingredients')}
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
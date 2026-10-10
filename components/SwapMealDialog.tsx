'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Alternative = {
  id: string
  name: string
  role: string
  cuisine: string | null
  meal_type: string
  tags: string[]
  score: number
  reasons: string[]
}

export function SwapMealDialog({
  planId,
  mealRowId,
  currentName,
  onClose,
}: {
  planId: string
  mealRowId: string
  currentName: string
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const res = await fetch(
        `/api/plans/${planId}/alternatives?mealRowId=${mealRowId}`
      )
      if (cancelled) return

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to load alternatives')
        setLoading(false)
        return
      }

      const body = await res.json()
      setAlternatives(body.alternatives ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [planId, mealRowId])

  async function handleSwap(mealId: string) {
    setSwapping(true)
    setError(null)

    const res = await fetch(
      `/api/plans/${planId}/meals/${mealRowId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealId }),
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to swap meal')
      setSwapping(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Swap meal
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-stone-900">
              Replacing: {currentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto sm:max-h-96">
          {loading && (
            <p className="px-4 py-8 text-center text-sm text-stone-500">
              Loading alternatives…
            </p>
          )}

          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && alternatives.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-stone-500">
              No alternatives available. Add more meals to the catalog.
            </p>
          )}

          {!loading && alternatives.length > 0 && (
            <ul className="divide-y divide-stone-100">
              {alternatives.map((alt) => (
                <li key={alt.id}>
                  <button
                    onClick={() => handleSwap(alt.id)}
                    disabled={swapping}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100 disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900">
                        {alt.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {alt.reasons[0] ?? 'no conflicts'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-stone-400">
                      {Math.round(alt.score)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
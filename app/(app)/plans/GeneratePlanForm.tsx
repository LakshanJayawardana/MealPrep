'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function nextMonday(): string {
  const d = new Date()
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ...
  const diff = (8 - day) % 7 || 7 // days until next Monday
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function GeneratePlanForm() {
  const router = useRouter()

  const [startDate, setStartDate] = useState(nextMonday())
  const [includeCatalog, setIncludeCatalog] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError(null)

    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, includeCatalog }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to generate plan')
      setGenerating(false)
      return
    }

    const { id } = await res.json()
    router.push(`/plans/${id}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border rounded-lg p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Start date (7-day plan)
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-50"
        >
          {generating ? 'Generating…' : 'Generate plan'}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeCatalog}
          onChange={(e) => setIncludeCatalog(e.target.checked)}
        />
        Include catalog meals (not just mine)
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
    </form>
  )
}
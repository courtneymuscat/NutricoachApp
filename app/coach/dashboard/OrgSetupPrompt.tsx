'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrgSetupPrompt() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setup() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/org/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    // Refresh so the page re-reads org_id from the DB
    router.refresh()
  }

  return (
    <div className="flex items-start justify-center py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md space-y-5 text-center">
        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Set up your organisation</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create your organisation to manage your coaching team, share templates, and view all clients in one place.
          </p>
        </div>

        <div className="text-left space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setup()}
              placeholder="e.g. Peak Performance Coaching"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={setup}
            disabled={!name.trim() || loading}
            className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create organisation'}
          </button>
        </div>
      </div>
    </div>
  )
}

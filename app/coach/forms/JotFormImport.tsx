'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JotFormImport() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [formId, setFormId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!apiKey.trim() || !formId.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/forms/import-jotform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jotformApiKey: apiKey.trim(), jotformFormId: formId.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Import failed')
      return
    }
    router.push(`/coach/forms/${data.id}/edit`)
  }

  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-gray-700">Import from JotForm</p>
          <p className="text-xs text-gray-400">Bring in an existing JotForm with all questions intact</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">JotForm API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your JotForm API key"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Found in JotForm → Account → API
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Form ID</label>
              <input
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="e.g. 250123456789"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                The number in your JotForm URL
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !apiKey.trim() || !formId.trim()}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Importing…' : 'Import form'}
          </button>
        </div>
      )}
    </div>
  )
}

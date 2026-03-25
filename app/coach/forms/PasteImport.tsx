'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PasteImport() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!title.trim() || !text.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/forms/import-paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    router.push(`/coach/forms/${data.id}/edit`)
  }

  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 space-y-3">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-gray-700">Paste questions from any form</p>
          <p className="text-xs text-gray-400">Works with Google Forms, Typeform, Word, PDF — paste and go</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Form name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client Intake Form"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paste your questions</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={`Paste your questions here — one per line. Any format works:\n\n1. What is your main goal?\n2. How many days can you train per week?\nDo you have any injuries?\n• What does your current diet look like?`}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Numbers, bullets, dashes are stripped automatically. After importing you can set question types (multiple choice, text, etc.) in the editor.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={handleImport}
            disabled={loading || !title.trim() || !text.trim()}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating form…' : 'Create form from questions'}
          </button>
        </div>
      )}
    </div>
  )
}

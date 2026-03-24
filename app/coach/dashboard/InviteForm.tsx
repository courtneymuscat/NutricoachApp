'use client'

import { useState } from 'react'

export default function InviteForm() {
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setLink(null)

    const res = await fetch('/api/coach/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to create invite')
    } else {
      setLink(json.url)
      setEmail('')
    }
    setPending(false)
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Invite a client</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="client@example.com"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {pending ? 'Generating…' : 'Generate link'}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      {link && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Share this link with your client:</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 truncate"
            />
            <button
              onClick={copyLink}
              className="flex-shrink-0 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Expires in 7 days.</p>
        </div>
      )}
    </div>
  )
}

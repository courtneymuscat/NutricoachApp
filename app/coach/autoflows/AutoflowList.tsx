'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Template = {
  id: string
  name: string
  description: string | null
  type: string
  total_steps: number
}

const TYPE_LABELS: Record<string, string> = {
  weekly_checkin: 'Weekly check-in',
  onboarding: 'Staged flow',
}

export default function AutoflowList({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState<string | null>(null)

  async function duplicate(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setDuplicating(id)
    const res = await fetch(`/api/coach/autoflows/${id}/duplicate`, { method: 'POST' })
    const d = await res.json()
    setDuplicating(null)
    if (d.id) router.push(`/coach/autoflows/${d.id}`)
  }

  return (
    <div className="space-y-2">
      {templates.map(t => (
        <a
          key={t.id}
          href={`/coach/autoflows/${t.id}`}
          className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between hover:border-gray-400 transition-colors group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{t.name}</p>
            {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {TYPE_LABELS[t.type] ?? t.type}
              </span>
              <span className="text-[11px] text-gray-400">{t.total_steps} steps</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => duplicate(e, t.id)}
              disabled={duplicating === t.id}
              title="Duplicate"
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
            >
              {duplicating === t.id ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  )
}

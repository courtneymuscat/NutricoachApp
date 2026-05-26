'use client'

import { useEffect, useState } from 'react'
import DeleteTemplateDialog from '@/app/components/DeleteTemplateDialog'

type ArchivedAutoflow = {
  id: string
  name: string
  description: string | null
  type: string | null
  total_steps: number | null
  created_at: string
  archived_at: string | null
}

export default function ArchivedAutoflowsPage() {
  const [items, setItems] = useState<ArchivedAutoflow[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<ArchivedAutoflow | null>(null)

  useEffect(() => {
    fetch('/api/coach/autoflows?archived=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setItems(d) })
      .finally(() => setLoading(false))
  }, [])

  async function restore(id: string) {
    setRestoringId(id)
    try {
      const res = await fetch('/api/coach/templates/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'autoflow_templates', id, restore: true }),
      })
      if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Archived autoflows</h1>
          <p className="text-xs text-gray-500 mt-0.5">Restore to put back in your library, or delete permanently to remove every trace.</p>
        </div>
        <a href="/coach/autoflows" className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          ← Back to active
        </a>
      </div>

      <main className="w-full p-6">
        {loading && <p className="text-sm text-gray-400 text-center py-12">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            No archived autoflows.<br />
            <span className="text-xs">Archive a flow from its editor to send it here while keeping every client&apos;s responses intact.</span>
          </p>
        )}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <div key={p.id} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex flex-col">
                <p className="text-sm font-semibold text-gray-700 leading-snug">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  Archived {p.archived_at ? new Date(p.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => restore(p.id)}
                    disabled={restoringId === p.id}
                    className="flex-1 text-center text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg py-1.5 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {restoringId === p.id ? '…' : 'Restore'}
                  </button>
                  <button
                    onClick={() => setDeletingTarget(p)}
                    className="flex-1 text-center text-xs font-semibold text-red-500 border border-red-100 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deletingTarget && (
        <DeleteTemplateDialog
          table="autoflow_templates"
          templateId={deletingTarget.id}
          templateName={deletingTarget.name}
          hardDeleteUrl={`/api/coach/autoflows/${deletingTarget.id}`}
          alreadyArchived
          onClose={() => setDeletingTarget(null)}
          onRemoved={() => {
            setItems((prev) => prev.filter((p) => p.id !== deletingTarget.id))
            setDeletingTarget(null)
          }}
        />
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import DeleteTemplateDialog from '@/app/components/DeleteTemplateDialog'

type ArchivedForm = {
  id: string
  title: string
  type: string | null
  is_active: boolean | null
  created_at: string
  archived_at: string | null
}

export default function ArchivedFormsPage() {
  const [items, setItems] = useState<ArchivedForm[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<ArchivedForm | null>(null)

  useEffect(() => {
    fetch('/api/forms?archived=1')
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
        body: JSON.stringify({ table: 'forms', id, restore: true }),
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
          <h1 className="text-lg font-bold text-gray-900">Archived forms</h1>
          <p className="text-xs text-gray-500 mt-0.5">Restore to put back in your library, or delete permanently to remove every submission and answer.</p>
        </div>
        <a href="/coach/forms" className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          ← Back to active
        </a>
      </div>

      <main className="w-full p-6">
        {loading && <p className="text-sm text-gray-400 text-center py-12">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            No archived forms.<br />
            <span className="text-xs">Archive a form to send it here while keeping every client submission intact.</span>
          </p>
        )}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="bg-gray-50 rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 leading-snug truncate">{p.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Archived {p.archived_at ? new Date(p.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => restore(p.id)}
                    disabled={restoringId === p.id}
                    className="text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {restoringId === p.id ? '…' : 'Restore'}
                  </button>
                  <button
                    onClick={() => setDeletingTarget(p)}
                    className="text-xs font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
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
          table="forms"
          templateId={deletingTarget.id}
          templateName={deletingTarget.title}
          hardDeleteUrl={`/api/forms/${deletingTarget.id}`}
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

'use client'

import { useState, useEffect } from 'react'

type Template = {
  id: string
  name: string
  created_at: string
  created_by: string | null
}

type OrgTemplates = {
  autoflows: Template[]
  programs: Template[]
  meal_plans: Template[]
  forms: Template[]
  note_templates: Template[]
}

type GroupKey = keyof OrgTemplates
type TableName = 'autoflow_templates' | 'programs' | 'meal_plans' | 'forms' | 'note_templates'

const GROUPS: { key: GroupKey; label: string; table: TableName; emptyLink: string; emptyLinkLabel: string }[] = [
  { key: 'autoflows',      label: 'Autoflows',      table: 'autoflow_templates', emptyLink: '/coach/autoflows',    emptyLinkLabel: 'Go to Autoflows' },
  { key: 'programs',       label: 'Programs',       table: 'programs',           emptyLink: '/coach/programs',     emptyLinkLabel: 'Go to Programs' },
  { key: 'meal_plans',     label: 'Meal Plans',     table: 'meal_plans',         emptyLink: '/coach/meal-plans',   emptyLinkLabel: 'Go to Meal Plans' },
  { key: 'forms',          label: 'Forms',          table: 'forms',              emptyLink: '/coach/forms',        emptyLinkLabel: 'Go to Forms' },
  { key: 'note_templates', label: 'Note Templates', table: 'note_templates',     emptyLink: '/coach/note-templates', emptyLinkLabel: 'Go to Note Templates' },
]

// ─── Publish modal ────────────────────────────────────────────────────────────

function PublishModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [templateId, setTemplateId] = useState('')
  const [table, setTable] = useState<TableName>('autoflow_templates')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!templateId.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/org/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId.trim(), table }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Publish template to organisation</h3>
        <p className="text-sm text-gray-500">
          This makes the template visible to all coaches in your org. To find a template&apos;s ID,
          open it and copy the UUID from the URL.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template type</label>
          <select
            value={table}
            onChange={(e) => setTable(e.target.value as TableName)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            {GROUPS.map(({ table: t, label }) => (
              <option key={t} value={t}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
          <input
            type="text"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            placeholder="Paste the template UUID…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!templateId.trim() || saving}
            className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function OrgTemplatesTab() {
  const [templates, setTemplates] = useState<OrgTemplates | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishOpen, setPublishOpen] = useState(false)

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/org/templates')
    if (res.ok) setTemplates(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTemplates() }, [])

  const totalCount = templates
    ? Object.values(templates).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Organisation Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Shared templates visible to all coaches in your org ·{' '}
            <span className="font-medium text-gray-700">{totalCount} total</span>
          </p>
        </div>
        <button
          onClick={() => setPublishOpen(true)}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          + Publish template
        </button>
      </div>

      {GROUPS.map(({ key, label, emptyLink, emptyLinkLabel }) => {
        const items = templates?.[key] ?? []
        return (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 text-sm">{label}</h3>
              <span className="text-xs text-gray-400">
                {items.length} template{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">No shared {label.toLowerCase()} yet.</p>
                <a
                  href={emptyLink}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {emptyLinkLabel} →
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((t) => (
                  <div key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Published {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      disabled
                      title="Copying org templates to your account is coming soon"
                      className="text-xs border border-gray-200 text-gray-300 px-3 py-1.5 rounded-lg cursor-not-allowed select-none"
                    >
                      Use template
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-gray-400 text-center pb-2">
        &ldquo;Use template&rdquo; (copy to personal account) is coming in a future update.
      </p>

      {publishOpen && (
        <PublishModal
          onClose={() => setPublishOpen(false)}
          onDone={() => { setPublishOpen(false); fetchTemplates() }}
        />
      )}
    </div>
  )
}

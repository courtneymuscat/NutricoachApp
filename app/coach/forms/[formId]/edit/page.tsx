'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

type QuestionType = 'text' | 'textarea' | 'number' | 'select'

type Question = {
  id: string | null   // null = not yet saved
  order_index: number
  label: string
  type: QuestionType
  options: string[] | null
  required: boolean
  _dirty?: boolean
}

type FormMeta = {
  title: string
  description: string
  type: 'onboarding' | 'weekly_checkin' | 'custom'
  is_active: boolean
}

const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  number: 'Number',
  select: 'Multiple choice',
}

export default function FormBuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params)
  const router = useRouter()
  const isNew = formId === 'new'

  const [meta, setMeta] = useState<FormMeta>({ title: '', description: '', type: 'weekly_checkin', is_active: true })
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : formId)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/forms/${formId}`)
      .then((r) => r.json())
      .then((d) => {
        setMeta({ title: d.title, description: d.description ?? '', type: d.type, is_active: d.is_active })
        setQuestions(d.questions ?? [])
        setLoading(false)
      })
  }, [formId, isNew])

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: null, order_index: prev.length, label: '', type: 'text', options: null, required: false, _dirty: true },
    ])
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch, _dirty: true } : q))
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })))
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const next = [...questions]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setQuestions(next.map((q, i) => ({ ...q, order_index: i, _dirty: true })))
  }

  async function handleSave() {
    if (!meta.title.trim()) { setError('Form title is required'); return }
    setSaving(true)
    setError(null)

    // 1. Create or update form
    let fId = savedId
    if (!fId) {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); setSaving(false); return }
      fId = d.id
      setSavedId(fId)
    } else {
      await fetch(`/api/forms/${fId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
      })
    }

    // 2. Save questions
    for (const [i, q] of questions.entries()) {
      if (!q._dirty) continue
      if (!q.id) {
        // New question
        await fetch(`/api/forms/${fId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...q, order_index: i }),
        })
      } else {
        await fetch(`/api/forms/questions/${q.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...q, order_index: i }),
        })
      }
    }

    // 3. Delete removed questions (handled inline via removeQuestion + API)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    if (isNew && fId) router.replace(`/coach/forms/${fId}/edit`)
  }

  async function handleDeleteQuestion(idx: number) {
    const q = questions[idx]
    if (q.id) {
      await fetch(`/api/forms/questions/${q.id}`, { method: 'DELETE' })
    }
    removeQuestion(idx)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Loading…</p></div>

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/coach/forms" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-lg font-bold text-gray-900">{isNew ? 'New form' : 'Edit form'}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save form'}
        </button>
      </div>

      <main className="max-w-2xl mx-auto w-full p-6 space-y-6">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        {/* Form metadata */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Form title</label>
            <input
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              placeholder="e.g. Weekly Check-In"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              rows={2}
              placeholder="Instructions for your clients…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Form type</label>
              <select
                value={meta.type}
                onChange={(e) => setMeta((m) => ({ ...m, type: e.target.value as FormMeta['type'] }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="onboarding">Onboarding</option>
                <option value="weekly_checkin">Weekly check-in</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={meta.is_active}
                  onChange={(e) => setMeta((m) => ({ ...m, is_active: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <QuestionCard
              key={idx}
              q={q}
              idx={idx}
              total={questions.length}
              onChange={(patch) => updateQuestion(idx, patch)}
              onDelete={() => handleDeleteQuestion(idx)}
              onMove={(dir) => moveQuestion(idx, dir)}
            />
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          + Add question
        </button>
      </main>
    </div>
  )
}

function QuestionCard({
  q, idx, total, onChange, onDelete, onMove,
}: {
  q: Question
  idx: number
  total: number
  onChange: (patch: Partial<Question>) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [optionInput, setOptionInput] = useState('')

  function addOption() {
    const val = optionInput.trim()
    if (!val) return
    onChange({ options: [...(q.options ?? []), val] })
    setOptionInput('')
  }

  function removeOption(i: number) {
    onChange({ options: (q.options ?? []).filter((_, j) => j !== i) })
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white'

  return (
    <div className="bg-white rounded-2xl border p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-1 pt-1">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <input
            value={q.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Question…"
            className={inputClass}
          />

          <div className="flex gap-2">
            <select
              value={q.type}
              onChange={(e) => onChange({ type: e.target.value as QuestionType, options: e.target.value === 'select' ? [] : null })}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
          </div>

          {q.type === 'select' && (
            <div className="space-y-1.5">
              {(q.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">{opt}</span>
                  <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="Add option…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button onClick={addOption} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2">Add</button>
              </div>
            </div>
          )}
        </div>

        <button onClick={onDelete} className="text-gray-300 hover:text-red-400 mt-1 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  )
}

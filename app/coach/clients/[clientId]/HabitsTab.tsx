'use client'

import { useState, useEffect } from 'react'

type Habit = {
  id: string
  name: string
  type: string
  target: number
  unit: string
  icon: string
  active: boolean
}

const HABIT_PRESETS = [
  { name: 'Daily Steps', icon: '👟', unit: 'steps', target: 10000 },
  { name: 'Water Intake', icon: '💧', unit: 'glasses', target: 8 },
  { name: 'Sleep Hours', icon: '😴', unit: 'hours', target: 8 },
  { name: 'Protein Target', icon: '🥩', unit: 'g protein', target: 150 },
  { name: 'No Alcohol', icon: '🚫', unit: 'times', target: 1 },
  { name: 'Morning Walk', icon: '🌅', unit: 'times', target: 1 },
]


export default function HabitsTab({ clientId }: { clientId: string }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '✓', unit: 'times', target: '1' })
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editForm, setEditForm] = useState({ name: '', icon: '', unit: '', target: '' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach/clients/${clientId}/habits`)
      .then((r) => r.json())
      .then((d) => setHabits(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [clientId])

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/coach/clients/${clientId}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, icon: form.icon, unit: form.unit, target: Number(form.target) || 1, type: 'daily' }),
    })
    if (res.ok) {
      const created = await res.json()
      setHabits((prev) => [created, ...prev])
      setShowAdd(false)
      setForm({ name: '', icon: '✓', unit: 'times', target: '1' })
    }
    setSaving(false)
  }

  async function toggleActive(habit: Habit) {
    await fetch(`/api/coach/clients/${clientId}/habits/${habit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !habit.active }),
    })
    setHabits((prev) => prev.map((h) => h.id === habit.id ? { ...h, active: !h.active } : h))
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit)
    setEditForm({ name: habit.name, icon: habit.icon, unit: habit.unit, target: String(habit.target) })
  }

  async function handleEdit() {
    if (!editingHabit || !editForm.name.trim()) return
    setEditSaving(true)
    const res = await fetch(`/api/coach/clients/${clientId}/habits/${editingHabit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        icon: editForm.icon,
        unit: editForm.unit,
        target: Number(editForm.target) || 1,
        active: editingHabit.active,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h))
      setEditingHabit(null)
    }
    setEditSaving(false)
  }

  async function deleteHabit(id: string) {
    if (!confirm('Remove this habit from client?')) return
    await fetch(`/api/coach/clients/${clientId}/habits/${id}`, { method: 'DELETE' })
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  function usePreset(preset: typeof HABIT_PRESETS[0]) {
    setForm({ name: preset.name, icon: preset.icon, unit: preset.unit, target: String(preset.target) })
  }

  if (loading) return <p className="text-sm text-gray-400 text-center py-10">Loading habits…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {habits.length === 0 ? 'No habits assigned' : `${habits.filter((h) => h.active).length} active habits`}
          </p>
          {habits.some((h) => h.active) && (
            <p className="text-xs text-gray-400 mt-0.5">Active habits appear every day in your client&apos;s app.</p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Add Habit
        </button>
      </div>

      {habits.length === 0 && (
        <div className="text-center py-14 bg-white rounded-2xl border">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm text-gray-500 mb-1">No habits assigned</p>
          <p className="text-xs text-gray-400 mb-4">Add daily habits like steps, water, sleep targets for your client to track.</p>
          <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Add first habit
          </button>
        </div>
      )}

      {habits.map((habit) => (
        <div key={habit.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${!habit.active ? 'opacity-50' : ''}`}>
          <span className="text-2xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{habit.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Target: {habit.target} {habit.unit} · {habit.type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit */}
            <button
              onClick={() => openEdit(habit)}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              title="Edit habit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* Active/Deactivate toggle */}
            <button
              onClick={() => toggleActive(habit)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                habit.active
                  ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500'
                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
              }`}
              title={habit.active ? 'Click to deactivate' : 'Click to activate'}
            >
              {habit.active ? 'Active' : 'Inactive'}
            </button>
            {/* Delete */}
            <button onClick={() => deleteHabit(habit.id)} className="text-gray-300 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Edit habit modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Edit Habit</h2>
              <button onClick={() => setEditingHabit(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editForm.icon}
                  onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🎯"
                  className="w-14 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Habit name"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editForm.target}
                  onChange={(e) => setEditForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder="Target"
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="unit (steps, glasses…)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Deactivate toggle inside edit modal */}
              <button
                onClick={() => setEditingHabit((h) => h ? { ...h, active: !h.active } : h)}
                className={`w-full py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  editingHabit.active
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {editingHabit.active ? 'Deactivate this habit' : 'Activate this habit'}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingHabit(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editForm.name.trim() || editSaving}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add habit modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Add Habit</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Presets */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick add</p>
              <div className="grid grid-cols-3 gap-1.5">
                {HABIT_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => usePreset(p)}
                    className="text-xs text-left border border-gray-200 rounded-lg p-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-base">{p.icon}</span>
                    <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{p.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🎯"
                  className="w-14 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Habit name"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                  placeholder="Target"
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="unit (steps, glasses…)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add Habit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

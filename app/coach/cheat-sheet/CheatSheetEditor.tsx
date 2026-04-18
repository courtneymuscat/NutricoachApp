'use client'

import { useEffect, useState } from 'react'

type Food = {
  id: string
  name: string
  serving_desc: string | null
  calories: number | null
  protein_g: number
  carbs_g: number
  fat_g: number
  primary_category: string
  secondary_categories: string[]
  subcategory: string | null
  is_default?: boolean
  is_hidden?: boolean
  is_custom?: boolean
}

const CATEGORIES = [
  { id: 'protein',    label: 'Protein',           serve: '1 serve ≈ 30g protein',  color: 'bg-pink-50 border-pink-200',   badge: 'bg-pink-100 text-pink-700',   macro: 'protein' },
  { id: 'carb',       label: 'Carbs',              serve: '1 serve ≈ 20g carbs',    color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', macro: 'carbs' },
  { id: 'fruit',      label: 'Fruit',              serve: '1 serve ≈ 20g carbs',    color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', macro: 'carbs' },
  { id: 'fat',        label: 'Fats',               serve: '1 serve ≈ 10g fat',      color: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-700',   macro: 'fat' },
  { id: 'condiment',  label: 'Condiments',         serve: '1 serve ≈ fat or carb',  color: 'bg-blue-50 border-blue-200',    badge: 'bg-blue-100 text-blue-700',     macro: null },
  { id: 'free',       label: 'Free Foods',         serve: 'Unlimited / ~0 cal',     color: 'bg-gray-50 border-gray-200',    badge: 'bg-gray-100 text-gray-600',     macro: null },
]

const SECONDARY_LABELS: Record<string, string> = {
  fat:  '+ 1 fat serve',
  carb: '+ 1 carb serve',
}
const SECONDARY_COLORS: Record<string, string> = {
  fat:  'bg-green-100 text-green-700',
  carb: 'bg-purple-100 text-purple-700',
}

const EMPTY_FORM = { name: '', serving_desc: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', primary_category: 'protein', secondary_categories: [] as string[] }

export default function CheatSheetEditor() {
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'simple' | 'detailed'>('simple')
  const [showHidden, setShowHidden] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/coach/cheat-sheet')
      .then(r => r.json())
      .then(d => setFoods(d.foods ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function toggleHide(food: Food) {
    setToggling(food.id)
    const newHidden = !food.is_hidden
    setFoods(p => p.map(f => f.id === food.id ? { ...f, is_hidden: newHidden } : f))
    await fetch('/api/coach/cheat-sheet/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_id: food.id, is_hidden: newHidden }),
    })
    setToggling(null)
  }

  async function addFood() {
    if (!form.name.trim()) return
    setSaving(true)
    const r = await fetch('/api/coach/cheat-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        calories: form.calories ? parseFloat(form.calories) : null,
        protein_g: parseFloat(form.protein_g || '0'),
        carbs_g: parseFloat(form.carbs_g || '0'),
        fat_g: parseFloat(form.fat_g || '0'),
      }),
    })
    const d = await r.json()
    setFoods(p => [...p, { ...d.food, is_custom: true, is_hidden: false }])
    setForm({ ...EMPTY_FORM })
    setShowAddModal(false)
    setSaving(false)
  }

  async function deleteCustom(food: Food) {
    if (!confirm(`Remove "${food.name}"?`)) return
    setFoods(p => p.filter(f => f.id !== food.id))
    await fetch(`/api/coach/cheat-sheet/custom/${food.id}`, { method: 'DELETE' })
  }

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm animate-pulse">Loading cheat sheet…</div>

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button onClick={() => setView('simple')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'simple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Simple
          </button>
          <button onClick={() => setView('detailed')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'detailed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Detailed
          </button>
        </div>
        <button
          onClick={() => setShowHidden(v => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showHidden ? 'Hide' : 'Show'} hidden foods
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add Food
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 inline-block" />
          also uses 1 fat serve
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-100 inline-block" />
          also uses 1 carb serve
        </span>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        const catFoods = foods.filter(f => f.primary_category === cat.id && (showHidden || !f.is_hidden))
        if (catFoods.length === 0) return null
        return (
          <div key={cat.id} className={`rounded-2xl border ${cat.color} overflow-hidden`}>
            {/* Category header */}
            <div className="px-5 py-4 flex items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">{cat.label}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{cat.serve} · ~100 cal per serve</p>
              </div>
              <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badge}`}>
                {catFoods.filter(f => !f.is_hidden).length} foods
              </span>
            </div>

            {view === 'detailed' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-white/60">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 w-full">Food / Serving</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Cal</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Carbs g</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Fat g</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Protein g</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">Extra serves</th>
                      <th className="px-2 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60 bg-white/50">
                    {catFoods.map(food => (
                      <tr key={food.id} className={`transition-colors hover:bg-white/80 ${food.is_hidden ? 'opacity-40' : ''}`}>
                        <td className="px-5 py-2.5">
                          <span className="font-medium text-gray-900">{food.name}</span>
                          {food.serving_desc && <span className="text-gray-400 text-xs ml-2">{food.serving_desc}</span>}
                          {food.is_custom && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Custom</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">{food.calories ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right text-purple-700 font-medium tabular-nums">{food.carbs_g}</td>
                        <td className="px-3 py-2.5 text-right text-green-700 font-medium tabular-nums">{food.fat_g}</td>
                        <td className="px-3 py-2.5 text-right text-pink-700 font-medium tabular-nums">{food.protein_g}</td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {(food.secondary_categories ?? []).map(s => (
                              <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${SECONDARY_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>
                                {SECONDARY_LABELS[s] ?? s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          {food.is_custom ? (
                            <button onClick={() => deleteCustom(food)} className="text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                          ) : (
                            <button
                              onClick={() => toggleHide(food)}
                              disabled={toggling === food.id}
                              className="text-gray-300 hover:text-gray-500 transition-colors text-xs disabled:opacity-40"
                              title={food.is_hidden ? 'Show food' : 'Hide food'}
                            >
                              {food.is_hidden ? '👁' : '—'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catFoods.map(food => (
                  <div
                    key={food.id}
                    className={`bg-white rounded-xl border border-white px-3.5 py-2.5 flex items-center gap-3 group transition-all ${food.is_hidden ? 'opacity-40' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{food.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{food.serving_desc ?? ''}</p>
                      {(food.secondary_categories ?? []).length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {food.secondary_categories.map(s => (
                            <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${SECONDARY_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>
                              {SECONDARY_LABELS[s] ?? s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {food.is_custom ? (
                        <button onClick={() => deleteCustom(food)} className="text-gray-300 hover:text-red-400 transition-colors text-xs">✕</button>
                      ) : (
                        <button
                          onClick={() => toggleHide(food)}
                          disabled={toggling === food.id}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
                          title={food.is_hidden ? 'Show' : 'Hide'}
                        >
                          {food.is_hidden ? 'Show' : 'Hide'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add Custom Food</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Food name *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Greek yoghurt" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Serving size</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.serving_desc} onChange={e => setForm(f => ({ ...f, serving_desc: e.target.value }))} placeholder="e.g. 170g" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Calories</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="100" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-pink-500 block mb-1 font-medium">Protein g</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.protein_g} onChange={e => setForm(f => ({ ...f, protein_g: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-purple-500 block mb-1 font-medium">Carbs g</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.carbs_g} onChange={e => setForm(f => ({ ...f, carbs_g: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-green-500 block mb-1 font-medium">Fat g</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.fat_g} onChange={e => setForm(f => ({ ...f, fat_g: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.primary_category} onChange={e => setForm(f => ({ ...f, primary_category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Also uses (optional)</label>
                <div className="flex gap-3">
                  {['fat', 'carb'].map(s => (
                    <label key={s} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox"
                        checked={form.secondary_categories.includes(s)}
                        onChange={e => setForm(f => ({
                          ...f,
                          secondary_categories: e.target.checked
                            ? [...f.secondary_categories, s]
                            : f.secondary_categories.filter(x => x !== s),
                        }))}
                        className="rounded border-gray-300"
                      />
                      + 1 {s} serve
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={addFood} disabled={saving || !form.name.trim()} className="text-sm font-medium bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Add Food'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

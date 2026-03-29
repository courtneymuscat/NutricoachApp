'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import FoodSearch, { type FoodResult } from './FoodSearch'
import MealScanModal from './MealScanModal'

const MEALS = [
  { key: 'breakfast' as const, label: 'Breakfast' },
  { key: 'lunch' as const, label: 'Lunch' },
  { key: 'dinner' as const, label: 'Dinner' },
  { key: 'snacks' as const, label: 'Snacks' },
]

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

type FoodLog = {
  id: string
  food_name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  notes: string | null        // AI scan ingredient JSON
  meal_notes: string | null   // user-entered notes
  meal_photo_url: string | null
}

function todayString() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function sumMacros(logs: FoodLog[]) {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein: acc.protein + (l.protein ?? 0),
      carbs: acc.carbs + (l.carbs ?? 0),
      fat: acc.fat + (l.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function fmt1(n: number) { return Math.round(n * 10) / 10 }

type MealIngredient = { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }

function parseMealIngredients(notes: string | null): MealIngredient[] | null {
  if (!notes) return null
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].name === 'string') return parsed
  } catch { /* not JSON */ }
  return null
}

export default function DailyLog({
  canScanMeal = false,
  targetCalories = null,
  targetProtein = null,
  targetCarbs = null,
  targetFat = null,
}: {
  canScanMeal?: boolean
  targetCalories?: number | null
  targetProtein?: number | null
  targetCarbs?: number | null
  targetFat?: number | null
}) {
  const [date, setDate] = useState(todayString)
  const [logsByMeal, setLogsByMeal] = useState<Record<MealKey, FoodLog[]>>({
    breakfast: [], lunch: [], dinner: [], snacks: [],
  })
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<MealKey | null>(null)
  const [pendingEntry, setPendingEntry] = useState<{ food: FoodResult; grams: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const [searchKey, setSearchKey] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ food_name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [scanningMeal, setScanningMeal] = useState<MealKey | null>(null)
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)
  const [noteError, setNoteError] = useState<string | null>(null)
  // Meal-level notes (one per meal per day, stored in meal_notes table)
  const [mealNotes, setMealNotes] = useState<Record<string, { note: string | null; photo_url: string | null }>>({})
  const [mealNoteOpen, setMealNoteOpen] = useState<MealKey | null>(null)
  const [mealNoteDraft, setMealNoteDraft] = useState('')
  const [uploadingMealNote, setUploadingMealNote] = useState<MealKey | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const [{ data }, { data: mealNoteData }] = await Promise.all([
      supabase
        .from('food_logs')
        .select('id, food_name, calories, protein, carbs, fat, notes, meal_notes, meal_photo_url, meal_type')
        .eq('user_id', session.user.id)
        .eq('log_date', date)
        .order('created_at', { ascending: true }),
      supabase
        .from('meal_notes')
        .select('meal_type, note, photo_url')
        .eq('user_id', session.user.id)
        .eq('log_date', date),
    ])

    const grouped: Record<MealKey, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] }
    for (const log of data ?? []) {
      const meal = (log.meal_type ?? 'breakfast') as MealKey
      if (meal in grouped) grouped[meal].push(log as FoodLog)
    }
    setLogsByMeal(grouped)

    const notesMap: Record<string, { note: string | null; photo_url: string | null }> = {}
    for (const n of mealNoteData ?? []) notesMap[n.meal_type] = { note: n.note, photo_url: n.photo_url }
    setMealNotes(notesMap)

    setLoading(false)
  }, [date])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  useEffect(() => {
    function onMealLogged() { fetchLogs() }
    window.addEventListener('meal-logged', onMealLogged)
    return () => window.removeEventListener('meal-logged', onMealLogged)
  }, [fetchLogs])

  async function handleLog() {
    if (!pendingEntry || !addingTo) return
    setSaving(true)
    setLogError(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLogError('Not authenticated'); setSaving(false); return }

    const { food, grams } = pendingEntry
    const factor = grams / 100

    const { error } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      food_name: food.name,
      calories: Math.round(food.calories_per_100g * factor),
      protein: fmt1(food.protein_per_100g * factor),
      carbs: fmt1(food.carbs_per_100g * factor),
      fat: fmt1(food.fat_per_100g * factor),
      meal_type: addingTo,
      log_date: date,
    })

    if (error) {
      setLogError(error.message)
      setSaving(false)
      return
    }

    // Save to history (non-blocking)
    supabase.from('user_food_history').insert({
      user_id: session.user.id,
      food_id: food.id,
      name: food.name,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
    })

    setSaving(false)
    setPendingEntry(null)
    setSearchKey((k) => k + 1) // reset FoodSearch
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
    fetchLogs()
  }

  function startEdit(log: FoodLog) {
    setEditingId(log.id)
    setEditValues({
      food_name: log.food_name ?? log.notes ?? '',
      calories: String(log.calories),
      protein: String(log.protein),
      carbs: String(log.carbs),
      fat: String(log.fat),
    })
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('food_logs').delete().eq('id', id)
    fetchLogs()
  }

  async function handleUpdate() {
    if (!editingId) return
    const supabase = createClient()
    await supabase.from('food_logs').update({
      food_name: editValues.food_name || null,
      calories: Number(editValues.calories) || 0,
      protein: Number(editValues.protein) || 0,
      carbs: Number(editValues.carbs) || 0,
      fat: Number(editValues.fat) || 0,
    }).eq('id', editingId)
    setEditingId(null)
    fetchLogs()
  }

  async function saveNote(id: string, text: string) {
    setNoteError(null)
    const supabase = createClient()
    const { error } = await supabase.from('food_logs').update({ meal_notes: text.trim() || null }).eq('id', id)
    if (error) { setNoteError(error.message); return }
    fetchLogs()
  }

  async function uploadMealPhoto(id: string, file: File) {
    setNoteError(null)
    setUploadingPhotoId(id)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setUploadingPhotoId(null); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/${id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setNoteError(`Photo upload failed: ${uploadError.message}`)
      setUploadingPhotoId(null)
      return
    }

    const { data: signed } = await supabase.storage
      .from('meal-photos')
      .createSignedUrl(path, 315360000)

    if (signed?.signedUrl) {
      const { error: dbError } = await supabase.from('food_logs').update({ meal_photo_url: signed.signedUrl }).eq('id', id)
      if (dbError) { setNoteError(dbError.message); setUploadingPhotoId(null); return }
    }

    setUploadingPhotoId(null)
    fetchLogs()
  }

  async function saveMealNote(mealKey: MealKey, text: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('meal_notes').upsert({
      user_id: session.user.id,
      log_date: date,
      meal_type: mealKey,
      note: text.trim() || null,
    }, { onConflict: 'user_id,log_date,meal_type' })
    fetchLogs()
  }

  async function uploadMealNotePhoto(mealKey: MealKey, file: File) {
    setUploadingMealNote(mealKey)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setUploadingMealNote(null); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${session.user.id}/meal-${date}-${mealKey}.${ext}`

    const { error } = await supabase.storage.from('meal-photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrl(path, 315360000)
      if (signed?.signedUrl) {
        await supabase.from('meal_notes').upsert({
          user_id: session.user.id,
          log_date: date,
          meal_type: mealKey,
          photo_url: signed.signedUrl,
        }, { onConflict: 'user_id,log_date,meal_type' })
      }
    }
    setUploadingMealNote(null)
    fetchLogs()
  }

  const allLogs = Object.values(logsByMeal).flat()
  const totals = sumMacros(allLogs)
  const isToday = date === todayString()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Food Log</h3>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayString())}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Today
            </button>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setAddingTo(null); setPendingEntry(null) }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Daily totals */}
      {allLogs.length > 0 && (
        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {isToday ? "Today's Total" : 'Daily Total'}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', value: Math.round(totals.calories), unit: 'kcal', color: 'text-white' },
              { label: 'Protein', value: fmt1(totals.protein), unit: 'g', color: 'text-macro-p' },
              { label: 'Carbs', value: fmt1(totals.carbs), unit: 'g', color: 'text-macro-c' },
              { label: 'Fat', value: fmt1(totals.fat), unit: 'g', color: 'text-macro-f' },
            ].map(({ label, value, unit, color }) => (
              <div key={label}>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400">{unit}</p>
                <p className="text-xs text-gray-500 hidden sm:block">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining targets */}
      {allLogs.length > 0 && targetCalories && (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Remaining</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              {
                label: 'Calories', unit: 'kcal',
                remaining: targetCalories - Math.round(totals.calories),
                color: 'text-gray-900',
              },
              {
                label: 'Protein', unit: 'g',
                remaining: fmt1((targetProtein ?? 0) - totals.protein),
                color: 'text-macro-p',
              },
              {
                label: 'Carbs', unit: 'g',
                remaining: fmt1((targetCarbs ?? 0) - totals.carbs),
                color: 'text-macro-c',
              },
              {
                label: 'Fat', unit: 'g',
                remaining: fmt1((targetFat ?? 0) - totals.fat),
                color: 'text-macro-f',
              },
            ].map(({ label, unit, remaining, color }) => {
              const over = remaining < 0
              return (
                <div key={label}>
                  <p className={`text-base font-bold ${over ? 'text-red-400' : color}`}>
                    {over ? `+${Math.abs(Number(remaining))}` : remaining}
                  </p>
                  <p className="text-[10px] text-gray-400">{over ? `${unit} over` : unit}</p>
                  <p className="text-[10px] text-gray-400 hidden sm:block">{label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          {MEALS.map((meal) => {
            const logs = logsByMeal[meal.key]
            const mt = sumMacros(logs)
            const isAdding = addingTo === meal.key

            const mealNote = mealNotes[meal.key]
            const mealNoteIsOpen = mealNoteOpen === meal.key

            return (
              <div key={meal.key} className="bg-white rounded-xl border border-gray-100">
                {/* Meal header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">{meal.label}</p>
                      {/* Meal-level note / photo button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (mealNoteIsOpen) { setMealNoteOpen(null) }
                          else { setMealNoteOpen(meal.key); setMealNoteDraft(mealNote?.note ?? '') }
                        }}
                        className={`p-1 rounded transition-colors ${mealNote?.note || mealNote?.photo_url ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'}`}
                        title="Add note / photo to this meal"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </button>
                    </div>
                    {logs.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Math.round(mt.calories)} kcal
                        <span className="text-macro-p ml-2">P {fmt1(mt.protein)}g</span>
                        <span className="text-macro-c ml-1">C {fmt1(mt.carbs)}g</span>
                        <span className="text-macro-f ml-1">F {fmt1(mt.fat)}g</span>
                      </p>
                    )}
                    {/* Meal note preview */}
                    {mealNote?.note && (
                      <p className="text-xs text-blue-500 italic mt-0.5 truncate">{mealNote.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {/* Meal photo thumbnail */}
                    {mealNote?.photo_url && (
                      <a href={mealNote.photo_url} target="_blank" rel="noopener noreferrer">
                        <img src={mealNote.photo_url} alt="Meal" className="h-9 w-12 object-cover rounded-lg border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    )}
                    {!isAdding ? (
                      <>
                        {canScanMeal && (
                          <button
                            type="button"
                            onClick={() => setScanningMeal(meal.key)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Scan meal with camera"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setAddingTo(meal.key); setPendingEntry(null) }}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Food
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddingTo(null); setPendingEntry(null) }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Meal-level note / photo panel */}
                {mealNoteIsOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-2.5">
                    <textarea
                      value={mealNoteDraft}
                      onChange={(e) => setMealNoteDraft(e.target.value)}
                      rows={2}
                      placeholder={`Add a note about ${meal.label.toLowerCase()}…`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {uploadingMealNote === meal.key ? 'Uploading…' : mealNote?.photo_url ? 'Change photo' : 'Add photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingMealNote === meal.key}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMealNotePhoto(meal.key, f) }}
                        />
                      </label>
                      {mealNote?.photo_url && (
                        <a href={mealNote.photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={mealNote.photo_url} alt="Meal photo" className="h-10 w-14 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { saveMealNote(meal.key, mealNoteDraft); setMealNoteOpen(null) }}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Save note
                      </button>
                      <button
                        type="button"
                        onClick={() => setMealNoteOpen(null)}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Food items */}
                {logs.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {logs.map((log) => (
                      <div key={log.id}>
                        {editingId === log.id ? (
                          /* Inline edit form */
                          <div className="px-4 py-3 space-y-2 bg-gray-50/60">
                            <input
                              type="text"
                              value={editValues.food_name}
                              onChange={(e) => setEditValues((v) => ({ ...v, food_name: e.target.value }))}
                              placeholder="Food name"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <div className="grid grid-cols-4 gap-2">
                              {([
                                { key: 'calories', label: 'kcal' },
                                { key: 'protein', label: 'P (g)' },
                                { key: 'carbs', label: 'C (g)' },
                                { key: 'fat', label: 'F (g)' },
                              ] as const).map(({ key, label }) => (
                                <div key={key}>
                                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={editValues[key]}
                                    onChange={(e) => setEditValues((v) => ({ ...v, [key]: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleUpdate}
                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (() => {
                          const ingredients = parseMealIngredients(log.notes)
                          const isExpanded = expandedLogId === log.id
                          return (
                            <div>
                              <div className="flex items-center gap-2 px-4 py-2.5 group">
                                {/* Expand toggle if this is a saved meal */}
                                {ingredients && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                    className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                                  >
                                    <svg className={`h-3.5 w-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-800 font-medium truncate">
                                    {log.food_name ?? 'Food entry'}
                                  </p>
                                  {ingredients && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {ingredients.map((i) => i.name).join(', ')}
                                    </p>
                                  )}
                                  {log.meal_notes && (
                                    <p className="text-xs text-blue-500 italic truncate mt-0.5">{log.meal_notes}</p>
                                  )}
                                </div>
                                {/* Meal photo thumbnail */}
                                {log.meal_photo_url && (
                                  <a href={log.meal_photo_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                    <img src={log.meal_photo_url} alt="Meal" className="h-9 w-12 object-cover rounded-lg border border-gray-100 hover:opacity-80 transition-opacity" />
                                  </a>
                                )}
                                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                                  <span className="font-semibold text-gray-700">{log.calories} kcal</span>
                                  <span className="text-macro-p hidden sm:inline">P {log.protein}g</span>
                                  <span className="text-macro-c hidden sm:inline">C {log.carbs}g</span>
                                  <span className="text-macro-f hidden sm:inline">F {log.fat}g</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Note icon — always visible when note/photo exists */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (noteOpenId === log.id) { setNoteOpenId(null); setNoteError(null) }
                                      else { setNoteOpenId(log.id); setNoteDraft(log.meal_notes ?? ''); setNoteError(null) }
                                    }}
                                    className={`p-1 rounded transition-colors ${log.meal_notes || log.meal_photo_url ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-100'}`}
                                    title="Note / photo"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                  </button>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(log)}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      aria-label="Edit"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828A2 2 0 0110 14H8v-2a2 2 0 01.586-1.414z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(log.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      aria-label="Delete"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Note / photo panel */}
                              {noteOpenId === log.id && (
                                <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-2.5">
                                  <textarea
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    rows={2}
                                    placeholder="Add a note about this meal…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
                                  />
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex-shrink-0">
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {uploadingPhotoId === log.id ? 'Uploading…' : log.meal_photo_url ? 'Change photo' : 'Add photo'}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingPhotoId === log.id}
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMealPhoto(log.id, f) }}
                                      />
                                    </label>
                                    {log.meal_photo_url && (
                                      <a href={log.meal_photo_url} target="_blank" rel="noopener noreferrer">
                                        <img src={log.meal_photo_url} alt="Meal photo" className="h-10 w-14 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                                      </a>
                                    )}
                                  </div>
                                  {noteError && (
                                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{noteError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { saveNote(log.id, noteDraft).then(() => { if (!noteError) setNoteOpenId(null) }) }}
                                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                    >
                                      Save note
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setNoteOpenId(null); setNoteError(null) }}
                                      className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Expanded ingredient list */}
                              {ingredients && isExpanded && (
                                <div className="border-t border-gray-50 bg-gray-50/60 divide-y divide-gray-100">
                                  {ingredients.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-6 py-1.5 text-xs">
                                      <span className="text-gray-600">{item.name} <span className="text-gray-400">· {item.grams}g</span></span>
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <span>{item.calories} kcal</span>
                                        <span className="text-macro-p">P {item.protein}g</span>
                                        <span className="text-macro-c">C {item.carbs}g</span>
                                        <span className="text-macro-f">F {item.fat}g</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {logs.length === 0 && !isAdding && (
                  <p className="px-4 pb-3 text-xs text-gray-400">Nothing logged yet</p>
                )}

                {/* Add food panel */}
                {isAdding && (
                  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/40">
                    <FoodSearch key={searchKey} onSelect={(food, grams) => setPendingEntry({ food, grams })} />
                    {logError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{logError}</p>
                    )}
                    {justAdded && (
                      <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 font-medium">Added! Search for another food or cancel.</p>
                    )}
                    <button
                      type="button"
                      onClick={handleLog}
                      disabled={!pendingEntry || saving}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {saving ? 'Adding...' : `Add to ${meal.label}`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {scanningMeal && (
        <MealScanModal
          mealKey={scanningMeal}
          date={date}
          onLogged={fetchLogs}
          onClose={() => setScanningMeal(null)}
        />
      )}
    </div>
  )
}

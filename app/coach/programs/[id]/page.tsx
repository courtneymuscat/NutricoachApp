'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  weight: string
  rest: number
  notes: string
  video_url: string
}

type Day = {
  id: string
  name: string
  exercises: Exercise[]
}

type Week = {
  id: string
  label: string
  days: Day[]
}

type Program = {
  id: string
  name: string
  description: string | null
  content: Week[]
  created_at: string
  updated_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function newExercise(): Exercise {
  return {
    id: crypto.randomUUID(),
    name: '',
    sets: 3,
    reps: '8-12',
    weight: '',
    rest: 90,
    notes: '',
    video_url: '',
  }
}

function newDay(): Day {
  return {
    id: crypto.randomUUID(),
    name: 'Day',
    exercises: [],
  }
}

function newWeek(index: number): Week {
  return {
    id: crypto.randomUUID(),
    label: `Week ${index}`,
    days: [],
  }
}

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1 min', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
]

// ── Exercise row ───────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  onChange,
  onDelete,
}: {
  exercise: Exercise
  onChange: (ex: Exercise) => void
  onDelete: () => void
}) {
  function field<K extends keyof Exercise>(key: K, value: Exercise[K]) {
    onChange({ ...exercise, [key]: value })
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white hover:border-gray-200 transition-colors group">
      {/* Row 1: name + delete */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => field('name', e.target.value)}
          placeholder="Exercise name"
          className="flex-1 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
        />
        {exercise.video_url ? (
          <a
            href={exercise.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-700 flex-shrink-0"
            title="View video"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </a>
        ) : null}
        <button
          onClick={onDelete}
          className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
          title="Remove exercise"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Row 2: sets, reps, weight, rest */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sets</label>
          <input
            type="number"
            min={1}
            max={20}
            value={exercise.sets}
            onChange={(e) => field('sets', parseInt(e.target.value) || 1)}
            className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Reps</label>
          <input
            type="text"
            value={exercise.reps}
            onChange={(e) => field('reps', e.target.value)}
            placeholder="8-12"
            className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Load</label>
          <input
            type="text"
            value={exercise.weight}
            onChange={(e) => field('weight', e.target.value)}
            placeholder="RPE 8"
            className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center gap-1">
          <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Rest</label>
          <select
            value={exercise.rest}
            onChange={(e) => field('rest', parseInt(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {REST_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: notes + video_url */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={exercise.notes}
          onChange={(e) => field('notes', e.target.value)}
          placeholder="Notes (optional)"
          className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
        />
        <input
          type="url"
          value={exercise.video_url}
          onChange={(e) => field('video_url', e.target.value)}
          placeholder="Video URL"
          className="w-36 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
        />
      </div>
    </div>
  )
}

// ── Day block ──────────────────────────────────────────────────────────────────

function DayBlock({
  day,
  onChange,
  onDelete,
}: {
  day: Day
  onChange: (d: Day) => void
  onDelete: () => void
}) {
  const [editingName, setEditingName] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  function updateExercise(index: number, ex: Exercise) {
    const exercises = [...day.exercises]
    exercises[index] = ex
    onChange({ ...day, exercises })
  }

  function deleteExercise(index: number) {
    onChange({ ...day, exercises: day.exercises.filter((_, i) => i !== index) })
  }

  function addExercise() {
    onChange({ ...day, exercises: [...day.exercises, newExercise()] })
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        {editingName ? (
          <input
            ref={nameRef}
            autoFocus
            type="text"
            value={day.name}
            onChange={(e) => onChange({ ...day, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false) }}
            className="text-sm font-semibold text-gray-900 border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
            title="Click to rename"
          >
            {day.name || 'Unnamed day'}
            <svg className="w-3 h-3 inline ml-1.5 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors ml-2"
          title="Delete day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Exercises */}
      <div className="space-y-2">
        {day.exercises.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">No exercises yet. Add one below.</p>
        )}
        {day.exercises.map((ex, i) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            onChange={(updated) => updateExercise(i, updated)}
            onDelete={() => deleteExercise(i)}
          />
        ))}
      </div>

      <button
        onClick={addExercise}
        className="mt-3 w-full text-xs font-semibold text-blue-600 border border-dashed border-blue-200 rounded-xl py-2 hover:bg-blue-50 transition-colors"
      >
        + Add Exercise
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProgramBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [programId, setProgramId] = useState<string | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [activeWeekIndex, setActiveWeekIndex] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setProgramId(id))
  }, [params])

  // Load program
  useEffect(() => {
    if (!programId) return
    fetch(`/api/coach/programs/${programId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return
        setProgram({ ...d, content: Array.isArray(d.content) ? d.content : [] })
      })
      .finally(() => setLoading(false))
  }, [programId])

  // Debounced auto-save
  const scheduleSave = useCallback((updated: Program) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      const res = await fetch(`/api/coach/programs/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updated.name,
          description: updated.description,
          content: updated.content,
        }),
      })
      setSaving(false)
      setSaveStatus(res.ok ? 'saved' : 'error')
      if (res.ok) {
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    }, 1500)
  }, [])

  function updateProgram(updated: Program) {
    setProgram(updated)
    scheduleSave(updated)
  }

  function updateContent(content: Week[]) {
    if (!program) return
    updateProgram({ ...program, content })
  }

  async function saveNow() {
    if (!program) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)
    setSaveStatus('saving')
    const res = await fetch(`/api/coach/programs/${program.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: program.name,
        description: program.description,
        content: program.content,
      }),
    })
    setSaving(false)
    setSaveStatus(res.ok ? 'saved' : 'error')
    if (res.ok) setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function addWeek() {
    if (!program) return
    const next = [...program.content, newWeek(program.content.length + 1)]
    updateContent(next)
    setActiveWeekIndex(next.length - 1)
  }

  function deleteWeek(weekIndex: number) {
    if (!program) return
    const next = program.content.filter((_, i) => i !== weekIndex)
    updateContent(next)
    setActiveWeekIndex(Math.max(0, Math.min(activeWeekIndex, next.length - 1)))
  }

  function addDay() {
    if (!program) return
    const next = program.content.map((w, i) => {
      if (i !== activeWeekIndex) return w
      return { ...w, days: [...w.days, newDay()] }
    })
    updateContent(next)
  }

  function updateDay(dayIndex: number, day: Day) {
    if (!program) return
    const next = program.content.map((w, i) => {
      if (i !== activeWeekIndex) return w
      const days = [...w.days]
      days[dayIndex] = day
      return { ...w, days }
    })
    updateContent(next)
  }

  function deleteDay(dayIndex: number) {
    if (!program) return
    const next = program.content.map((w, i) => {
      if (i !== activeWeekIndex) return w
      return { ...w, days: w.days.filter((_, di) => di !== dayIndex) }
    })
    updateContent(next)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading program…</p>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-sm text-red-500 mb-4">Program not found or you don't have access.</p>
        <a href="/coach/programs" className="text-sm text-blue-600 hover:underline">← Back to Programs</a>
      </div>
    )
  }

  const activeWeek = program.content[activeWeekIndex] ?? null

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <a
          href="/coach/programs"
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          title="Back to Programs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              ref={nameRef}
              autoFocus
              type="text"
              value={program.name}
              onChange={(e) => setProgram({ ...program, name: e.target.value })}
              onBlur={() => { setEditingName(false); scheduleSave(program) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setEditingName(false); scheduleSave(program) } }}
              className="text-lg font-bold text-gray-900 border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors text-left flex items-center gap-1.5 group"
            >
              {program.name}
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400">Saving…</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-500">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500">Save failed</span>
          )}
          <button
            onClick={saveNow}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl border p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
            {editingDesc ? (
              <textarea
                ref={descRef}
                autoFocus
                value={program.description ?? ''}
                onChange={(e) => setProgram({ ...program, description: e.target.value })}
                onBlur={() => { setEditingDesc(false); scheduleSave(program) }}
                rows={3}
                placeholder="Describe this program…"
                className="w-full text-sm text-gray-700 border border-blue-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <button
                onClick={() => setEditingDesc(true)}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors text-left w-full flex items-start gap-2 group"
              >
                <span className={program.description ? 'text-gray-700' : 'text-gray-300 italic'}>
                  {program.description || 'Click to add a description…'}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Week tabs */}
          <div>
            <div className="flex items-center gap-1 flex-wrap mb-5">
              {program.content.map((week, i) => (
                <div key={week.id} className="flex items-center">
                  <button
                    onClick={() => setActiveWeekIndex(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      i === activeWeekIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {week.label}
                  </button>
                  {i === activeWeekIndex && (
                    <button
                      onClick={() => deleteWeek(i)}
                      className="ml-1 text-gray-300 hover:text-red-400 transition-colors"
                      title="Delete this week"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addWeek}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 border border-dashed border-blue-200 hover:bg-blue-50 transition-colors"
              >
                + Add Week
              </button>
            </div>

            {/* Week content */}
            {program.content.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border">
                <p className="text-sm text-gray-400 mb-3">No weeks yet. Add your first week to get started.</p>
                <button
                  onClick={addWeek}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  + Add Week 1
                </button>
              </div>
            ) : activeWeek ? (
              <div className="space-y-4">
                {activeWeek.days.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border">
                    <p className="text-sm text-gray-400 mb-3">No days in this week yet.</p>
                    <button
                      onClick={addDay}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      + Add Day
                    </button>
                  </div>
                )}

                {activeWeek.days.map((day, di) => (
                  <DayBlock
                    key={day.id}
                    day={day}
                    onChange={(updated) => updateDay(di, updated)}
                    onDelete={() => deleteDay(di)}
                  />
                ))}

                {activeWeek.days.length > 0 && (
                  <button
                    onClick={addDay}
                    className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  >
                    + Add Day
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

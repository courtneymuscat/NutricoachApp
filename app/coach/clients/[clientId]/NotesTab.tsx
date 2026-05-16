'use client'

import { useState, useEffect, useRef } from 'react'
import { noteBodyToHtml } from '@/lib/noteUtils'

type Note = {
  id: string
  body: string
  created_at: string
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-gray-400 text-center py-10">{label}</p>
}

const FONT_COLORS = ['#111827', '#ef4444', '#f97316', '#eab308', '#22c55e', '#1D9E75', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  function ToolBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
    return (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 text-sm font-semibold select-none"
      >
        {children}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap border border-gray-200 rounded-xl px-2 py-1.5 bg-gray-50">
      <ToolBtn title="Bold" onClick={() => exec('bold')}><span className="font-bold">B</span></ToolBtn>
      <ToolBtn title="Italic" onClick={() => exec('italic')}><span className="italic">I</span></ToolBtn>
      <ToolBtn title="Underline" onClick={() => exec('underline')}><span className="underline">U</span></ToolBtn>
      <ToolBtn title="Strikethrough" onClick={() => exec('strikeThrough')}><span className="line-through">S</span></ToolBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {FONT_COLORS.map(c => (
        <button
          key={c}
          type="button"
          title={`Colour ${c}`}
          onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c) }}
          className="w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: c }}
        />
      ))}
      <button
        type="button"
        title="Custom colour"
        onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click() }}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>
      <input ref={colorInputRef} type="color" className="sr-only" onChange={e => exec('foreColor', e.target.value)} />

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolBtn title="Highlight" onClick={() => highlightInputRef.current?.click()}>
        <span style={{ background: 'linear-gradient(transparent 50%, #fde047 50%)' }} className="px-0.5">H</span>
      </ToolBtn>
      <input ref={highlightInputRef} type="color" defaultValue="#fde047" className="sr-only" onChange={e => exec('hiliteColor', e.target.value)} />

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolBtn title="Heading" onClick={() => exec('formatBlock', '<h3>')}><span className="font-bold text-xs">H</span></ToolBtn>
      <ToolBtn title="Paragraph" onClick={() => exec('formatBlock', '<p>')}><span className="text-xs">¶</span></ToolBtn>
      <ToolBtn title="Bullet list" onClick={() => exec('insertUnorderedList')}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </ToolBtn>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolBtn title="Clear formatting" onClick={() => exec('removeFormat')}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </ToolBtn>
    </div>
  )
}

export default function NotesTab({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<{ id: string; name: string; body: string }[]>([])
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/coach/notes/${clientId}`).then((r) => r.json()),
      fetch('/api/coach/note-templates').then((r) => r.json()),
    ]).then(([notesData, tmplData]) => {
      setNotes(Array.isArray(notesData) ? notesData : [])
      setTemplates(Array.isArray(tmplData) ? tmplData : [])
    }).finally(() => setLoading(false))
  }, [clientId])

  function getHtml() { return editorRef.current?.innerHTML ?? '' }

  async function doSave(html: string, noteId: string | null): Promise<string | null> {
    const stripped = html.replace(/<[^>]*>/g, '').trim()
    if (!stripped) return noteId
    setSaveStatus('saving')
    if (noteId) {
      const res = await fetch(`/api/coach/notes/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, body: html }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes((prev) => prev.map((n) => n.id === noteId ? updated : n))
      }
      setSaveStatus('saved')
      return noteId
    } else {
      const res = await fetch(`/api/coach/notes/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: html }),
      })
      if (res.ok) {
        const note = await res.json()
        setNotes((prev) => [note, ...prev])
        setSaveStatus('saved')
        return note.id
      }
      setSaveStatus('idle')
      return null
    }
  }

  function scheduleAutoSave() {
    setSaveStatus('idle')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const html = getHtml()
      const id = await doSave(html, currentNoteId)
      if (id && !currentNoteId) setCurrentNoteId(id)
    }, 1500)
  }

  function startNew() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (editorRef.current) editorRef.current.innerHTML = ''
    setCurrentNoteId(null)
    setSaveStatus('idle')
  }

  function editNote(note: Note) {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (editorRef.current) editorRef.current.innerHTML = note.body
    setCurrentNoteId(note.id)
    setSaveStatus('saved')
    editorRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteNote(id: string) {
    await fetch(`/api/coach/notes/${clientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: id }),
    })
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (currentNoteId === id) startNew()
  }

  if (loading) return <p className="text-sm text-gray-400 py-10 text-center">Loading notes…</p>

  return (
    <div className="space-y-4">
      {/* Editor */}
      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentNoteId && (
              <button onClick={startNew} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {currentNoteId ? 'Editing note' : 'New note'}
            </label>
            {saveStatus === 'saving' && <span className="text-[11px] text-gray-400">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-[11px] text-green-500">Saved</span>}
          </div>
          <div className="flex items-center gap-3">
            {templates.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((t) => t.id === e.target.value)
                  if (t && editorRef.current) {
                    editorRef.current.innerHTML = noteBodyToHtml(t.body)
                    scheduleAutoSave()
                    e.target.value = ''
                  }
                }}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="" disabled>Use template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {templates.length === 0 && (
              <a href="/coach/note-templates" className="text-xs text-blue-500 hover:underline">+ Create templates</a>
            )}
          </div>
        </div>

        <RichToolbar editorRef={editorRef} />

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleAutoSave}
          data-placeholder="Write a note about this client… or pick a template above"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed overflow-auto prose prose-sm max-w-none"
          style={{ minHeight: '55vh' }}
        />
      </div>

      {/* Notes history */}
      {notes.length === 0 && <Empty label="No notes yet." />}
      {notes.map((note) => (
        <div key={note.id} className={`bg-white rounded-2xl border p-5 group relative transition-all ${currentNoteId === note.id ? 'border-blue-300 bg-blue-50' : ''}`}>
          <div
            className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: note.body }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">{fmtFull(note.created_at)}</p>
            <div className="flex items-center gap-3">
              <button onClick={() => editNote(note)} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
                Edit
              </button>
              <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

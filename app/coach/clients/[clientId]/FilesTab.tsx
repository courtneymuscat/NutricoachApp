'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientFile = { id?: string; url: string; label: string; formTitle: string; submittedAt: string; source?: string; saveToFile?: boolean }

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-gray-400 text-center py-10">{label}</p>
}

export default function FilesTab({ clientId }: { clientId: string }) {
  const [files, setFiles] = useState<ClientFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function loadFiles() {
    return fetch(`/api/coach/clients/${clientId}/files`)
      .then((r) => r.json())
      .then((d) => setFiles(Array.isArray(d) ? d : []))
  }

  useEffect(() => {
    loadFiles().finally(() => setLoading(false))
  }, [clientId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `coach-uploads/${clientId}/${Date.now()}.${ext}`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('client-uploads')
      .upload(path, file, { upsert: false })

    if (storageError || !storageData) {
      setUploadError(storageError?.message ?? 'Upload failed')
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data: urlData } = supabase.storage.from('client-uploads').getPublicUrl(storageData.path)
    const publicUrl = urlData.publicUrl

    const res = await fetch(`/api/coach/clients/${clientId}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl, name: file.name }),
    })

    if (!res.ok) {
      const d = await res.json()
      setUploadError(d.error ?? 'Failed to save file record')
    } else {
      await loadFiles()
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startRename(file: ClientFile) {
    setRenamingId(file.id!)
    setRenameValue(file.label)
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return
    const res = await fetch(`/api/coach/clients/${clientId}/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    if (res.ok) {
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, label: renameValue.trim() } : f))
    }
    setRenamingId(null)
  }

  async function handleDelete(file: ClientFile) {
    if (!confirm(`Delete "${file.label}"? This cannot be undone.`)) return
    setDeletingId(file.id!)
    const res = await fetch(`/api/coach/clients/${clientId}/files/${file.id}`, { method: 'DELETE' })
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    }
    setDeletingId(null)
  }

  if (loading) return <p className="text-sm text-gray-400 py-10 text-center">Loading files…</p>

  return (
    <div className="space-y-3">
      {/* Upload section */}
      <div className="bg-white rounded-2xl border p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Upload file for client</p>
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${uploading ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? 'Uploading…' : 'Choose file'}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      </div>

      {files.length === 0 && <Empty label="No files uploaded yet." />}
      {files.map((f, i) => {
        const isFormResponse = f.source === 'form'
        const isSavedToFile = isFormResponse && f.saveToFile === true
        const filename = isFormResponse ? '' : decodeURIComponent(f.url.split('/').pop()?.split('?')[0] ?? 'file')
        const ext = filename.split('.').pop()?.toLowerCase() ?? ''
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)
        return (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
              isSavedToFile ? 'border-emerald-200' : isFormResponse ? 'border-indigo-100' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSavedToFile ? 'bg-emerald-50' : isFormResponse ? 'bg-indigo-50' : 'bg-blue-50'
              }`}
            >
              {isSavedToFile ? (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h4l2 2h6a2 2 0 012 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
              ) : isFormResponse ? (
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ) : isImage ? (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {renamingId === f.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(f.id!); if (e.key === 'Escape') setRenamingId(null) }}
                    className="text-sm border border-blue-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                  />
                  <button onClick={() => handleRename(f.id!)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Save</button>
                  <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.label}</p>
                  {isSavedToFile ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Saved to file
                    </span>
                  ) : isFormResponse ? (
                    <span className="text-[10px] bg-indigo-50 text-indigo-500 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">Form</span>
                  ) : null}
                  {f.source === 'coach' && (
                    <span className="text-[10px] bg-teal-50 text-teal-500 font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">Coach</span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400">{f.formTitle} · {fmtFull(f.submittedAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={f.url}
                target={isFormResponse ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                {isFormResponse ? 'View response' : 'View'}
              </a>
              {f.source === 'coach' && f.id && renamingId !== f.id && (
                <>
                  <button
                    onClick={() => startRename(f)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(f)}
                    disabled={deletingId === f.id}
                    className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === f.id ? '…' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

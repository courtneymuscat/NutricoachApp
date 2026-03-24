'use client'

import { useState, useEffect, useRef } from 'react'

export type Exercise = {
  id: string
  name: string
  category: string
  equipment: string
  muscles?: string
  video_url?: string | null
}

const CATEGORIES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']

function getYouTubeId(url: string) {
  return url.match(/[?&]v=([^&]+)/)?.[1] ?? null
}

function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const videoId = getYouTubeId(url)
  if (!videoId) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
          <p className="text-white text-sm font-semibold truncate">{name}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none ml-3">
            ✕
          </button>
        </div>
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

type Props = {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExerciseSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [recent, setRecent] = useState<Exercise[]>([])
  const [category, setCategory] = useState('all')
  const [previewEx, setPreviewEx] = useState<Exercise | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetch('/api/exercises/recent')
      .then((r) => r.json())
      .then(setRecent)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: query })
      if (category !== 'all') params.set('category', category)
      const res = await fetch(`/api/exercises/search?${params}`)
      setResults(await res.json())
    }, 250)
    return () => clearTimeout(timer)
  }, [query, category])

  const list = query.length >= 2 ? results : recent
  const isRecent = query.length < 2

  return (
    <>
      {previewEx?.video_url && (
        <VideoModal
          url={previewEx.video_url}
          name={previewEx.name}
          onClose={() => setPreviewEx(null)}
        />
      )}

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg px-1">
            ✕
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {isRecent && recent.length > 0 && (
            <p className="text-xs text-gray-400 font-medium px-3 pb-1">Recently used</p>
          )}
          {list.length === 0 && query.length >= 2 && (
            <p className="text-sm text-gray-400 text-center py-4">No exercises found</p>
          )}
          {list.length === 0 && query.length < 2 && (
            <p className="text-sm text-gray-400 text-center py-4">Type to search 800+ exercises</p>
          )}
          {list.map((ex) => (
            <div key={ex.id} className="flex items-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
              <button
                onClick={() => onSelect(ex)}
                className="flex-1 text-left px-3 py-2.5"
              >
                <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {ex.category} · {ex.equipment}
                  {ex.muscles ? ` · ${ex.muscles}` : ''}
                </p>
              </button>
              {ex.video_url && (
                <button
                  onClick={() => setPreviewEx(ex)}
                  title="Watch demo"
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors mr-2"
                >
                  <svg className="w-3.5 h-3.5 text-red-600 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Convo = {
  id: string
  coach_id: string
  last_message_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function ClientMessagesPage() {
  const router = useRouter()
  const [convos, setConvos] = useState<Convo[]>([])
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [latestMap, setLatestMap] = useState<Record<string, { body: string; sender_id: string; attachment_type?: string | null }>>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [coachId, setCoachId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetch('/api/client/messages/list')
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setConvos(data.convos ?? [])
        setProfileMap(data.profileMap ?? {})
        setUnreadMap(data.unreadMap ?? {})
        setLatestMap(data.latestMap ?? {})
        setUserId(data.userId ?? null)
        setCoachId(data.coachId ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function startConversation() {
    if (!coachId || !userId || starting) return
    setStarting(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId, clientId: userId }),
    })
    const data = await res.json()
    setStarting(false)
    if (data.id) router.push(`/messages/${data.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
            <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
          </div>
          <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b px-5 py-4 flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>

        {convos.length === 0 && (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            {coachId ? (
              <>
                <p className="text-gray-400 text-sm mt-1 mb-5">Send your coach a message to get started.</p>
                <button
                  onClick={startConversation}
                  disabled={starting}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {starting ? 'Opening chat…' : 'Message your coach'}
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-sm mt-1">Your coach will reach out to you here.</p>
            )}
          </div>
        )}

        {convos.map((c) => {
          const unread = unreadMap[c.id] ?? 0
          const latest = latestMap[c.id]
          const email = profileMap[c.coach_id] ?? 'Your Coach'
          const latestBody = latest
            ? (latest.attachment_type === 'audio' ? '🎤 Voice note' : `${latest.sender_id === userId ? 'You: ' : ''}${latest.body || '📎 Attachment'}`)
            : 'No messages yet'
          return (
            <a
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-green-600">{email[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{email}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(c.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${unread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {latestBody}
                  </p>
                  {unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{unread}</span>
                    </span>
                  )}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

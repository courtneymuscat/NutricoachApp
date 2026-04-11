'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Convo = {
  id: string
  client_id: string
  last_message_at: string
}
type Client = { id: string; email: string; full_name?: string | null }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function CoachMessagesPage() {
  const router = useRouter()
  const [convos, setConvos] = useState<Convo[]>([])
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [latestMap, setLatestMap] = useState<Record<string, { body: string; sender_id: string; attachment_type?: string | null }>>({})
  const [coachId, setCoachId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // New conversation modal
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/coach/messages/list')
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setConvos(data.convos ?? [])
        setProfileMap(data.profileMap ?? {})
        setUnreadMap(data.unreadMap ?? {})
        setLatestMap(data.latestMap ?? {})
        setCoachId(data.coachId ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function openModal() {
    setShowModal(true)
    if (clients.length > 0) return
    setClientsLoading(true)
    const res = await fetch('/api/coach/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setClientsLoading(false)
  }

  async function startConversation(clientId: string) {
    if (!coachId || creating) return
    setCreating(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId, clientId }),
    })
    const data = await res.json()
    setCreating(false)
    setShowModal(false)
    if (data.id) router.push(`/coach/messages/${data.id}`)
  }

  if (loading) {
    return (
      <main className="flex-1 flex flex-col max-w-2xl w-full">
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
      </main>
    )
  }

  return (
    <>
      <main className="flex-1 flex flex-col max-w-2xl w-full">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <p className="text-xs text-gray-400 mt-0.5">{convos.length} conversation{convos.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-sm font-medium bg-gray-900 text-white px-3.5 py-2 rounded-xl hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New message
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start a conversation with a client.</p>
            </div>
          )}

          {convos.map((c) => {
            const unread = unreadMap[c.id] ?? 0
            const latest = latestMap[c.id]
            const email = profileMap[c.client_id] ?? 'Unknown'
            const latestBody = latest
              ? (latest.attachment_type === 'audio' ? '🎤 Voice note' : `${latest.sender_id === coachId ? 'You: ' : ''}${latest.body || '📎 Attachment'}`)
              : 'No messages yet'
            return (
              <a
                key={c.id}
                href={`/coach/messages/${c.id}`}
                className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">{email[0].toUpperCase()}</span>
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
      </main>

      {/* New conversation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">New message</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {clientsLoading && <p className="text-sm text-gray-400 text-center py-8">Loading clients…</p>}
              {!clientsLoading && clients.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No active clients found.</p>
              )}
              {clients.map(c => {
                const label = c.full_name || c.email
                return (
                  <button
                    key={c.id}
                    onClick={() => startConversation(c.id)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{label[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                      {c.full_name && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

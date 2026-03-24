'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function ChatView({
  conversationId,
  currentUserId,
  otherEmail,
  backHref,
}: {
  conversationId: string
  currentUserId: string
  otherEmail: string
  backHref: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Load messages + mark read
  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((msgs) => {
        setMessages(Array.isArray(msgs) ? msgs : [])
        setLoading(false)
      })

    fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' })
  }, [conversationId])

  // Scroll on initial load
  useEffect(() => {
    if (!loading) scrollToBottom(false)
  }, [loading, scrollToBottom])

  // Supabase realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Mark as read if from the other person
          if (msg.sender_id !== currentUserId) {
            fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' })
          }
          setTimeout(() => scrollToBottom(true), 50)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, scrollToBottom])

  async function handleSend() {
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    setInput('')

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })

    if (res.ok) {
      const msg = await res.json()
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg])
      setTimeout(() => scrollToBottom(true), 50)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a href={backHref} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600">{otherEmail[0].toUpperCase()}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{otherEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
        {loading && (
          <p className="text-center text-xs text-gray-400 py-8">Loading messages…</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const showDay = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at)
          const showTail = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="flex items-center justify-center my-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {dayLabel(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mb-2' : 'mb-0.5'}`}>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm'
                    }`}
                  >
                    {msg.body}
                  </div>
                  {showTail && (
                    <span className="text-xs text-gray-400 px-1">
                      {formatTime(msg.created_at)}
                      {isMe && msg.read_at && (
                        <span className="ml-1 text-blue-400">· Read</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3 flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          rows={1}
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
          style={{ minHeight: '42px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}

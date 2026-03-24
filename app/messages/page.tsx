import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClientMessagesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, coach_id, last_message_at')
    .eq('client_id', userId)
    .order('last_message_at', { ascending: false })

  const coachIds = (convos ?? []).map((c) => c.coach_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', coachIds.length ? coachIds : ['none'])
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]))

  const convoIds = (convos ?? []).map((c) => c.id)

  const { data: unreadMsgs } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convoIds.length ? convoIds : ['none'])
    .neq('sender_id', userId)
    .is('read_at', null)

  const unreadMap: Record<string, number> = {}
  for (const m of unreadMsgs ?? []) {
    unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
  }

  const { data: latestMsgs } = await supabase
    .from('messages')
    .select('conversation_id, body, sender_id')
    .in('conversation_id', convoIds.length ? convoIds : ['none'])
    .order('created_at', { ascending: false })

  const latestMap: Record<string, { body: string; sender_id: string }> = {}
  for (const m of latestMsgs ?? []) {
    if (!latestMap[m.conversation_id]) latestMap[m.conversation_id] = m
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
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

        {(!convos || convos.length === 0) && (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Your coach will reach out to you here.</p>
          </div>
        )}

        {(convos ?? []).map((c) => {
          const unread = unreadMap[c.id] ?? 0
          const latest = latestMap[c.id]
          const email = profileMap[c.coach_id] ?? 'Your Coach'
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
                    {latest
                      ? `${latest.sender_id === userId ? 'You: ' : ''}${latest.body}`
                      : 'No messages yet'}
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

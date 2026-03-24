import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/** GET — list all conversations for the current user */
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const userId = session.user.id

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, coach_id, client_id, last_message_at')
    .or(`coach_id.eq.${userId},client_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })

  if (!convos?.length) return Response.json([])

  // Get the other participant's profile for each conversation
  const otherIds = convos.map((c) => c.coach_id === userId ? c.client_id : c.coach_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', otherIds)
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]))

  // Get unread count per conversation
  const { data: unread } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', convos.map((c) => c.id))
    .neq('sender_id', userId)
    .is('read_at', null)

  const unreadMap: Record<string, number> = {}
  for (const m of unread ?? []) {
    unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
  }

  // Get latest message per conversation
  const { data: latestMsgs } = await supabase
    .from('messages')
    .select('conversation_id, body, created_at, sender_id')
    .in('conversation_id', convos.map((c) => c.id))
    .order('created_at', { ascending: false })

  const latestMap: Record<string, { body: string; sender_id: string }> = {}
  for (const m of latestMsgs ?? []) {
    if (!latestMap[m.conversation_id]) latestMap[m.conversation_id] = m
  }

  const result = convos.map((c) => {
    const otherId = c.coach_id === userId ? c.client_id : c.coach_id
    return {
      id: c.id,
      otherId,
      otherEmail: profileMap[otherId] ?? 'Unknown',
      lastMessageAt: c.last_message_at,
      unreadCount: unreadMap[c.id] ?? 0,
      latestMessage: latestMap[c.id] ?? null,
      role: c.coach_id === userId ? 'coach' : 'client',
    }
  })

  return Response.json(result)
}

/** POST — create or retrieve a conversation between coach and client */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { coachId, clientId } = await req.json()
  if (!coachId || !clientId) return Response.json({ error: 'coachId and clientId required' }, { status: 400 })

  // Verify the coach-client relationship exists
  const { data: rel } = await supabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()

  if (!rel) return Response.json({ error: 'No active coach-client relationship' }, { status: 403 })

  // Upsert conversation
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      { coach_id: coachId, client_id: clientId },
      { onConflict: 'coach_id,client_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ id: data.id })
}

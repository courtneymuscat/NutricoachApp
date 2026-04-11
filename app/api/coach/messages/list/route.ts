import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, client_id, last_message_at')
    .eq('coach_id', coachId)
    .order('last_message_at', { ascending: false })

  const convoList = convos ?? []
  const clientIds = convoList.map((c) => c.client_id)
  const convoIds = convoList.map((c) => c.id)

  const [profilesRes, unreadRes, latestRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email')
      .in('id', clientIds.length ? clientIds : ['none']),
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convoIds.length ? convoIds : ['none'])
      .neq('sender_id', coachId)
      .is('read_at', null),
    supabase
      .from('messages')
      .select('conversation_id, body, sender_id, attachment_type')
      .in('conversation_id', convoIds.length ? convoIds : ['none'])
      .order('created_at', { ascending: false }),
  ])

  const profileMap: Record<string, string> = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p.email])
  )

  const unreadMap: Record<string, number> = {}
  for (const m of unreadRes.data ?? []) {
    unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
  }

  const latestMap: Record<string, { body: string; sender_id: string; attachment_type?: string | null }> = {}
  for (const m of latestRes.data ?? []) {
    if (!latestMap[m.conversation_id]) latestMap[m.conversation_id] = m
  }

  return Response.json({ coachId, convos: convoList, profileMap, unreadMap, latestMap })
}

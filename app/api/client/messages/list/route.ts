import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const userId = session.user.id

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, coach_id, last_message_at')
    .eq('client_id', userId)
    .order('last_message_at', { ascending: false })

  const convoList = convos ?? []
  const convoIds = convoList.map((c) => c.id)
  const coachIds = convoList.map((c) => c.coach_id)

  // Also look up the client's coach (to enable initiating if no conversations yet)
  const { data: coachRel } = await supabase
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const [profilesRes, unreadRes, latestRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email')
      .in('id', coachIds.length ? coachIds : ['none']),
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convoIds.length ? convoIds : ['none'])
      .neq('sender_id', userId)
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

  return Response.json({
    userId,
    coachId: coachRel?.coach_id ?? null,
    convos: convoList,
    profileMap,
    unreadMap,
    latestMap,
  })
}

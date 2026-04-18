import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import { sendPushToUser } from '@/lib/push'
import type { NextRequest } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  // Verify coach–client relationship
  const { data: rel } = await supabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()

  if (!rel) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Get or create conversation
  const { data: convo, error: convoErr } = await supabase
    .from('conversations')
    .upsert(
      { coach_id: coachId, client_id: clientId },
      { onConflict: 'coach_id,client_id', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (convoErr || !convo) return Response.json({ error: 'Could not open conversation' }, { status: 500 })

  const body = "Hi! Just a friendly reminder to submit your weekly check-in when you get a chance. It helps me keep track of your progress and give you the best support. 💪"

  const { error: msgErr } = await supabase
    .from('messages')
    .insert({ conversation_id: convo.id, sender_id: coachId, body })

  if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 })

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', convo.id)

  // Push notification to the client
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('first_name, full_name')
    .eq('id', coachId)
    .single()
  const coachName = coachProfile?.first_name ?? coachProfile?.full_name ?? 'Your coach'

  sendPushToUser(clientId, {
    title: coachName,
    body: 'Just a friendly reminder to submit your check-in when you get a chance',
    url: `/messages/${convo.id}`,
    icon: '/icons/icon-192.png',
    tag: `reminder-${clientId}`,
  }).catch(() => {/* silent */})

  return Response.json({ ok: true, conversationId: convo.id })
}

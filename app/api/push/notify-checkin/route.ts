import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push'

/**
 * Called by the client after submitting a check-in.
 * Looks up the client's coach and sends them a push notification.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  // Find the active coach for this client
  const { data: rel } = await supabase
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .single()

  if (!rel?.coach_id) return Response.json({ ok: true }) // not coached — nothing to notify

  // Get client's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, full_name')
    .eq('id', user.id)
    .single()

  const clientName = profile?.first_name ?? profile?.full_name ?? 'A client'

  // Fire and forget — don't block the response
  sendPushToUser(rel.coach_id, {
    title: 'New check-in',
    body: `${clientName} just submitted a check-in`,
    url: `/coach/check-ins`,
    icon: '/icons/icon-192.png',
    tag: `checkin-${user.id}`,
  }).catch(() => {/* silent */})

  return Response.json({ ok: true })
}

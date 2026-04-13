import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('coach_clients')
    .select('client_id, accepted_at, status')
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('accepted_at', { ascending: false })

  if (!rows?.length) return Response.json([])

  const clientIds = rows.map((r) => r.client_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, subscription_tier')
    .in('id', clientIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const clients = rows.map((r) => ({
    id: r.client_id,
    email: profileMap[r.client_id]?.email ?? 'Unknown',
    full_name: profileMap[r.client_id]?.full_name ?? null,
    subscription_tier: profileMap[r.client_id]?.subscription_tier ?? 'individual_free',
    joined_at: r.accepted_at,
  }))

  return Response.json(clients)
}

import { requireCoach } from '@/lib/coach'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientSearch from './ClientSearch'

export default async function CoachClientsPage() {
  const coachId = await requireCoach()
  if (!coachId) redirect('/dashboard')

  const supabase = await createClient()

  const { data: clientRows } = await supabase
    .from('coach_clients')
    .select('client_id, accepted_at, status')
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('accepted_at', { ascending: false })

  const clientIds = (clientRows ?? []).map((r) => r.client_id)

  let clients: { id: string; email: string; tier: string; joinedAt: string | null }[] = []

  if (clientIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, subscription_tier')
      .in('id', clientIds)

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    // Get last check-in per client
    const { data: latestCheckIns } = await supabase
      .from('check_ins')
      .select('user_id, created_at')
      .in('user_id', clientIds)
      .order('created_at', { ascending: false })

    const lastCheckIn: Record<string, string> = {}
    for (const c of latestCheckIns ?? []) {
      if (!lastCheckIn[c.user_id]) lastCheckIn[c.user_id] = c.created_at
    }

    clients = (clientRows ?? []).map((r) => ({
      id: r.client_id,
      email: profileMap[r.client_id]?.email ?? 'Unknown',
      tier: profileMap[r.client_id]?.subscription_tier ?? 'tier_1',
      joinedAt: r.accepted_at,
      lastCheckIn: lastCheckIn[r.client_id] ?? null,
    }))
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-4xl w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} active</p>
        </div>
        <a
          href="/coach/dashboard"
          className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          + Invite client
        </a>
      </div>

      <ClientSearch clients={clients as Parameters<typeof ClientSearch>[0]['clients']} />
    </main>
  )
}

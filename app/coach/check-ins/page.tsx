import { requireCoach } from '@/lib/coach'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CoachCheckInsPage() {
  const coachId = await requireCoach()
  if (!coachId) redirect('/dashboard')

  const supabase = await createClient()

  const { data: clientRows } = await supabase
    .from('coach_clients')
    .select('client_id')
    .eq('coach_id', coachId)
    .eq('status', 'active')

  const clientIds = (clientRows ?? []).map((r) => r.client_id)

  let checkIns: {
    id: string
    user_id: string
    created_at: string
    sleep_hours: number | null
    sleep_quality: string | null
    energy_level: string | null
    rhr: number | null
    hrv: number | null
    notes: string | null
  }[] = []

  let profileMap: Record<string, string> = {}

  if (clientIds.length) {
    const [{ data: ci }, { data: profiles }] = await Promise.all([
      supabase
        .from('check_ins')
        .select('id, user_id, created_at, sleep_hours, sleep_quality, energy_level, rhr, hrv, notes')
        .in('user_id', clientIds)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
    ])
    checkIns = ci ?? []
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email as string]))
  }

  const SLEEP_LABELS: Record<string, string> = {
    deep_restful: 'Deep & Restful', good: 'Good', okay: 'Okay', restless: 'Restless', poor: 'Poor',
  }
  const ENERGY_SHORT: Record<string, string> = {
    peaked: 'Peaked', high: 'High', moderate: 'Moderate', low: 'Low', sore: 'Sore', depleted: 'Depleted',
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-4xl w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-ins</h1>
        <p className="text-sm text-gray-500 mt-1">{checkIns.length} entries from your clients</p>
      </div>

      {checkIns.length === 0 && (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <p className="text-gray-500 font-medium">No check-ins yet</p>
          <p className="text-gray-400 text-sm mt-1">Check-ins from your clients will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {checkIns.map((c) => (
          <a
            key={c.id}
            href={`/coach/clients/${c.user_id}`}
            className="block bg-white rounded-2xl border p-5 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600">
                    {(profileMap[c.user_id] ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{profileMap[c.user_id] ?? 'Unknown'}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(c.created_at).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div>
                <p className="text-xs text-gray-400">Sleep</p>
                <p className="text-sm font-semibold text-gray-900">{c.sleep_hours != null ? `${c.sleep_hours}h` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Quality</p>
                <p className="text-sm font-semibold text-gray-900">{SLEEP_LABELS[c.sleep_quality ?? ''] ?? c.sleep_quality ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Energy</p>
                <p className="text-sm font-semibold text-gray-900">{ENERGY_SHORT[c.energy_level ?? ''] ?? c.energy_level ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">RHR</p>
                <p className="text-sm font-semibold text-gray-900">{c.rhr != null ? `${c.rhr}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">HRV</p>
                <p className="text-sm font-semibold text-gray-900">{c.hrv != null ? `${c.hrv}` : '—'}</p>
              </div>
            </div>
            {c.notes && (
              <p className="text-xs text-gray-500 italic mt-3 border-t border-gray-50 pt-3">"{c.notes}"</p>
            )}
          </a>
        ))}
      </div>
    </main>
  )
}

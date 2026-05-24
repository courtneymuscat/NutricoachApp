import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_supplements')
    .select('*')
    .or(`coach_id.is.null,coach_id.eq.${coachId}`)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Dedupe by lowercased name, preferring the coach's own row over the
  // shared seed row of the same name. PATCH on a shared row forks a
  // coach-owned copy; without this dedupe the library would briefly show
  // both versions side by side.
  const byName = new Map<string, Record<string, unknown>>()
  for (const row of data ?? []) {
    const key = String((row as { name?: string }).name ?? '').trim().toLowerCase()
    const current = byName.get(key)
    if (!current || (row as { coach_id: string | null }).coach_id === coachId) {
      byName.set(key, row as Record<string, unknown>)
    }
  }
  return Response.json(Array.from(byName.values()))
}

export async function POST(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, default_dosage, benefits, brand_url, considerations } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_supplements')
    .insert({ coach_id: coachId, name: name.trim(), default_dosage, benefits, brand_url, considerations })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, timezone')
    .eq('id', coachId)
    .single()

  return Response.json({
    email: user?.email ?? '',
    first_name: profile?.first_name ?? '',
    timezone: profile?.timezone ?? null,
  })
}

export async function PUT(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { first_name, timezone } = await req.json()

  const supabase = await createClient()
  const updates: Record<string, unknown> = { first_name: first_name?.trim() || null }
  if (timezone !== undefined) updates.timezone = timezone || null

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { timezone } = await req.json()
  if (!timezone) return Response.json({ error: 'timezone required' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ timezone })
    .eq('id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

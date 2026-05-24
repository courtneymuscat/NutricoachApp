import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

const ALLOWED_FIELDS = ['name', 'default_dosage', 'benefits', 'brand_url', 'considerations'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  for (const k of ALLOWED_FIELDS) if (k in body) updates[k] = body[k]

  const supabase = await createClient()

  // Load the row so we can pick the right write path. Shared seed rows
  // (coach_id IS NULL) are visible to every coach via the library GET but
  // can't be edited in place — the first edit forks a coach-owned copy
  // instead. Without this, PATCH silently affected 0 rows and the UI
  // appeared to "not save".
  const { data: existing, error: lookupErr } = await supabase
    .from('coach_supplements')
    .select('*')
    .eq('id', id)
    .or(`coach_id.is.null,coach_id.eq.${coachId}`)
    .maybeSingle()

  if (lookupErr) return Response.json({ error: lookupErr.message }, { status: 400 })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  if (existing.coach_id === coachId) {
    const { data, error } = await supabase
      .from('coach_supplements')
      .update(updates)
      .eq('id', id)
      .eq('coach_id', coachId)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json(data)
  }

  // Fork — copy the shared row into a coach-owned one with the patch
  // applied. The GET endpoint dedupes by name and prefers the coach's row,
  // so the shared original disappears from this coach's library on next
  // load while still remaining visible to other coaches.
  const forked = {
    coach_id: coachId,
    name:            updates.name            ?? existing.name,
    default_dosage:  updates.default_dosage  ?? existing.default_dosage,
    benefits:        updates.benefits        ?? existing.benefits,
    brand_url:       updates.brand_url       ?? existing.brand_url,
    considerations:  updates.considerations  ?? existing.considerations,
  }
  const { data, error } = await supabase
    .from('coach_supplements')
    .insert(forked)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('coach_supplements')
    .delete()
    .eq('id', id)
    .eq('coach_id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

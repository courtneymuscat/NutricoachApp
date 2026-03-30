import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; assignmentId: string }> }
) {
  const { clientId, assignmentId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.content !== undefined) updates.content = body.content
  if (body.status !== undefined) updates.status = body.status
  if (body.name !== undefined) updates.name = body.name
  if (body.start_date !== undefined) updates.start_date = body.start_date

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_programs')
    .update(updates)
    .eq('id', assignmentId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .select('id, program_id, name, content, start_date, status, created_at, updated_at')
    .single()

  if (error || !data) return Response.json({ error: error?.message ?? 'Not found' }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; assignmentId: string }> }
) {
  const { clientId, assignmentId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('client_programs')
    .delete()
    .eq('id', assignmentId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

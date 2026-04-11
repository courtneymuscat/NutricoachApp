import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, description, content, created_at, updated_at')
    .eq('id', id)
    .eq('coach_id', coachId)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = (body.name as string).trim()
  if (body.description !== undefined) updates.description = (body.description as string).trim() || null
  if (body.content !== undefined) updates.content = body.content

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', coachId)
    .select('id, name, description, content, created_at, updated_at')
    .single()

  if (error || !data) return Response.json({ error: error?.message ?? 'Not found' }, { status: 500 })

  // Propagate to existing client assignments if requested
  if (body.push_to_clients) {
    const clientUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) clientUpdates.name = updates.name
    if (updates.content !== undefined) clientUpdates.content = updates.content
    await supabase
      .from('client_programs')
      .update(clientUpdates)
      .eq('program_id', id)
      .eq('coach_id', coachId)
  }

  return Response.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id)
    .eq('coach_id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

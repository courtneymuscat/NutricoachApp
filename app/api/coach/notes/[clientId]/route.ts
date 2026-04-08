import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

async function verifyAccess(coachId: string, clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .single()
  return !!data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await verifyAccess(coachId, clientId))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('coach_notes')
    .select('id, body, created_at')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return Response.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await verifyAccess(coachId, clientId))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { body } = await req.json()
  if (!body?.trim()) return Response.json({ error: 'Note body is required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_notes')
    .insert({ coach_id: coachId, client_id: clientId, body: body.trim() })
    .select('id, body, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { noteId, body } = await req.json()
  if (!noteId || !body?.trim()) return Response.json({ error: 'noteId and body required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_notes')
    .update({ body: body.trim() })
    .eq('id', noteId)
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .select('id, body, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return Response.json({ error: 'noteId required' }, { status: 400 })

  const supabase = await createClient()
  await supabase
    .from('coach_notes')
    .delete()
    .eq('id', noteId)
    .eq('coach_id', coachId)
    .eq('client_id', clientId)

  return Response.json({ ok: true })
}

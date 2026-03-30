import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

async function verifyCoachClientRelationship(coachId: string, clientId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
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
  if (!(await verifyCoachClientRelationship(coachId, clientId))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_programs')
    .select('id, program_id, name, content, start_date, status, created_at, updated_at')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await verifyCoachClientRelationship(coachId, clientId))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { program_id, start_date } = body as { program_id: string; start_date?: string }
  if (!program_id) return Response.json({ error: 'program_id is required' }, { status: 400 })

  // Fetch the source program to snapshot name + content
  const supabase = await createClient()
  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('name, content')
    .eq('id', program_id)
    .eq('coach_id', coachId)
    .single()

  if (progError || !program) {
    return Response.json({ error: 'Program not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('client_programs')
    .insert({
      program_id,
      client_id: clientId,
      coach_id: coachId,
      name: program.name,
      content: program.content,
      start_date: start_date ?? new Date().toISOString().slice(0, 10),
      status: 'active',
    })
    .select('id, program_id, name, content, start_date, status, created_at, updated_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

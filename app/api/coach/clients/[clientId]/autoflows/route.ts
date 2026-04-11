import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ clientId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('client_autoflows')
    .select(`
      id, name, start_date, status, created_at,
      autoflow_templates ( type, total_steps ),
      autoflow_responses ( step_number )
    `)
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return Response.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { template_id, start_date, show_as_checkin_prompt } = await req.json()
  if (!template_id || !start_date) return Response.json({ error: 'template_id and start_date required' }, { status: 400 })

  const supabase = await createClient()

  const [{ data: template }, { data: steps }] = await Promise.all([
    supabase
      .from('autoflow_templates')
      .select('id, name, total_steps')
      .eq('id', template_id)
      .eq('coach_id', coachId)
      .single(),
    supabase
      .from('autoflow_template_steps')
      .select('step_number, title, day_offset, trigger_type')
      .eq('template_id', template_id)
      .order('step_number'),
  ])
  if (!template) return Response.json({ error: 'Template not found' }, { status: 404 })

  const { data: flow, error } = await supabase
    .from('client_autoflows')
    .insert({ coach_id: coachId, client_id: clientId, template_id, name: template.name, start_date, status: 'active', show_as_checkin_prompt: show_as_checkin_prompt === true })
    .select('id')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Create calendar events for date-based steps only (skip on_step_complete triggered steps)
  if (steps && steps.length > 0) {
    const [y, m, d] = start_date.split('-').map(Number)
    const events = steps
      .filter((s) => (s as Record<string, unknown>).trigger_type !== 'on_step_complete')
      .map((s) => ({
        coach_id: coachId,
        client_id: clientId,
        event_date: new Date(Date.UTC(y, m - 1, d + s.day_offset)).toISOString().split('T')[0],
        type: 'autoflow',
        title: `${template.name} — Step ${s.step_number}${s.title ? `: ${s.title}` : ''}`,
        content: { flow_id: flow.id, step_number: s.step_number, link: `/autoflows/${flow.id}/${s.step_number}` },
      }))
    if (events.length > 0) await supabase.from('calendar_events').insert(events)
  }

  return Response.json({ id: flow.id })
}

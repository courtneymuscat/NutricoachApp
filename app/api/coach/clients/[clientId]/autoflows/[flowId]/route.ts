import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ clientId: string; flowId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const { data: flow } = await supabase
    .from('client_autoflows')
    .select('id, name, start_date, status, template_id, autoflow_templates(type, total_steps, core_questions)')
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .single()
  if (!flow) return Response.json({ error: 'Not found' }, { status: 404 })

  const [{ data: steps }, { data: overrides }, { data: responses }] = await Promise.all([
    supabase
      .from('autoflow_template_steps')
      .select('step_number, title, description, questions, day_offset')
      .eq('template_id', flow.template_id)
      .order('step_number'),
    supabase
      .from('client_autoflow_step_overrides')
      .select('step_number, questions')
      .eq('client_autoflow_id', flowId),
    supabase
      .from('autoflow_responses')
      .select('step_number, answers, submitted_at')
      .eq('client_autoflow_id', flowId)
      .order('step_number'),
  ])

  const overrideMap: Record<number, unknown[]> = Object.fromEntries(
    (overrides ?? []).map(o => [o.step_number, o.questions])
  )
  const responseMap: Record<number, { submitted_at: string; answers: unknown }> = Object.fromEntries(
    (responses ?? []).map(r => [r.step_number, { submitted_at: r.submitted_at, answers: r.answers }])
  )

  const enrichedSteps = (steps ?? []).map(s => ({
    ...s,
    questions: overrideMap[s.step_number] ?? s.questions,
    has_override: !!overrideMap[s.step_number],
    response: responseMap[s.step_number] ?? null,
  }))

  return Response.json({ ...flow, steps: enrichedSteps })
}

// PUT: save client-specific question override for a step
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { step_number, questions } = await req.json()
  if (!step_number) return Response.json({ error: 'step_number required' }, { status: 400 })

  const supabase = await createClient()

  const { data: flow } = await supabase
    .from('client_autoflows')
    .select('id')
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .single()
  if (!flow) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('client_autoflow_step_overrides')
    .upsert({ client_autoflow_id: flowId, step_number, questions: questions ?? [] }, { onConflict: 'client_autoflow_id,step_number' })

  return Response.json({ ok: true })
}

// PATCH: update start_date and regenerate calendar events
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { clientId, flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { start_date } = await req.json()
  if (!start_date) return Response.json({ error: 'start_date required' }, { status: 400 })

  const supabase = await createClient()

  // Verify ownership and get template info
  const { data: flow } = await supabase
    .from('client_autoflows')
    .select('id, name, template_id')
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .single()
  if (!flow) return Response.json({ error: 'Not found' }, { status: 404 })

  // Update start date
  await supabase
    .from('client_autoflows')
    .update({ start_date })
    .eq('id', flowId)

  // Delete old autoflow calendar events for this flow
  // content is jsonb — use ->> to extract flow_id as text
  await supabase
    .from('calendar_events')
    .delete()
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .eq('type', 'autoflow')
    .filter('content->>flow_id', 'eq', flowId)

  // Regenerate calendar events from template steps
  const { data: steps } = await supabase
    .from('autoflow_template_steps')
    .select('step_number, title, day_offset')
    .eq('template_id', flow.template_id)
    .order('step_number')

  if (steps && steps.length > 0) {
    const startMs = new Date(start_date).getTime()
    const events = steps.map((s) => {
      const eventDate = new Date(startMs + s.day_offset * 86400000).toISOString().split('T')[0]
      return {
        coach_id: coachId,
        client_id: clientId,
        event_date: eventDate,
        type: 'autoflow',
        title: `${flow.name} — Step ${s.step_number}${s.title ? `: ${s.title}` : ''}`,
        content: { flow_id: flowId, step_number: s.step_number, link: `/autoflows/${flowId}/${s.step_number}` },
      }
    })
    await supabase.from('calendar_events').insert(events)
  }

  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { clientId, flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  await supabase
    .from('client_autoflows')
    .delete()
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .eq('client_id', clientId)

  return Response.json({ ok: true })
}

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
      .select('step_number, questions, due_date')
      .eq('client_autoflow_id', flowId),
    supabase
      .from('autoflow_responses')
      .select('step_number, answers, submitted_at')
      .eq('client_autoflow_id', flowId)
      .order('step_number'),
  ])

  const overrideMap: Record<number, { questions?: unknown[]; due_date?: string | null }> = Object.fromEntries(
    (overrides ?? []).map(o => [o.step_number, { questions: o.questions, due_date: o.due_date ?? null }])
  )
  const responseMap: Record<number, { submitted_at: string; answers: unknown }> = Object.fromEntries(
    (responses ?? []).map(r => [r.step_number, { submitted_at: r.submitted_at, answers: r.answers }])
  )

  const enrichedSteps = (steps ?? []).map(s => ({
    ...s,
    questions: overrideMap[s.step_number]?.questions ?? s.questions,
    has_override: !!overrideMap[s.step_number]?.questions,
    due_date_override: overrideMap[s.step_number]?.due_date ?? null,
    response: responseMap[s.step_number] ?? null,
  }))

  return Response.json({ ...flow, steps: enrichedSteps })
}

// PUT: save client-specific question and/or due-date override for a step
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { clientId, flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { step_number, questions, due_date } = await req.json()
  if (!step_number) return Response.json({ error: 'step_number required' }, { status: 400 })

  const supabase = await createClient()

  const { data: flow } = await supabase
    .from('client_autoflows')
    .select('id, name, template_id')
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .single()
  if (!flow) return Response.json({ error: 'Not found' }, { status: 404 })

  // Build the upsert payload — only include due_date if explicitly passed
  const upsertPayload: Record<string, unknown> = {
    client_autoflow_id: flowId,
    step_number,
    questions: questions ?? [],
  }
  if (due_date !== undefined) upsertPayload.due_date = due_date ?? null

  await supabase
    .from('client_autoflow_step_overrides')
    .upsert(upsertPayload, { onConflict: 'client_autoflow_id,step_number' })

  // If due_date changed, update the corresponding calendar event
  if (due_date !== undefined && due_date !== null) {
    const { data: templateStep } = await supabase
      .from('autoflow_template_steps')
      .select('title')
      .eq('template_id', flow.template_id)
      .eq('step_number', step_number)
      .single()

    // Delete existing calendar event for this step
    await supabase
      .from('calendar_events')
      .delete()
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .eq('type', 'autoflow')
      .filter('content->>flow_id', 'eq', flowId)
      .filter('content->>step_number', 'eq', String(step_number))

    // Create new calendar event on the override date
    const title = `${flow.name} — Step ${step_number}${templateStep?.title ? `: ${templateStep.title}` : ''}`
    await supabase.from('calendar_events').insert({
      coach_id: coachId,
      client_id: clientId,
      event_date: due_date,
      type: 'autoflow',
      title,
      content: { flow_id: flowId, step_number, link: `/autoflows/${flowId}/${step_number}` },
    })
  }

  return Response.json({ ok: true })
}

// PATCH: update start_date and regenerate calendar events (respects per-step due_date overrides)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { clientId, flowId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { start_date } = await req.json()
  if (!start_date) return Response.json({ error: 'start_date required' }, { status: 400 })

  const supabase = await createClient()

  const { data: flow } = await supabase
    .from('client_autoflows')
    .select('id, name, template_id')
    .eq('id', flowId)
    .eq('coach_id', coachId)
    .single()
  if (!flow) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('client_autoflows')
    .update({ start_date })
    .eq('id', flowId)

  // Delete old autoflow calendar events for this flow
  await supabase
    .from('calendar_events')
    .delete()
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .eq('type', 'autoflow')
    .filter('content->>flow_id', 'eq', flowId)

  // Fetch template steps + any per-step due_date overrides
  const [{ data: steps }, { data: overrides }] = await Promise.all([
    supabase
      .from('autoflow_template_steps')
      .select('step_number, title, day_offset')
      .eq('template_id', flow.template_id)
      .order('step_number'),
    supabase
      .from('client_autoflow_step_overrides')
      .select('step_number, due_date')
      .eq('client_autoflow_id', flowId),
  ])

  const overrideDates: Record<number, string> = Object.fromEntries(
    (overrides ?? []).filter(o => o.due_date).map(o => [o.step_number, o.due_date])
  )

  if (steps && steps.length > 0) {
    const startMs = new Date(start_date).getTime()
    const events = steps.map((s) => {
      // Prefer per-step override date; fall back to start_date + day_offset
      const eventDate = overrideDates[s.step_number]
        ?? new Date(startMs + s.day_offset * 86400000).toISOString().split('T')[0]
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

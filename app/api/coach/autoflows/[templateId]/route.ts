import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ templateId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { templateId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const [{ data: template }, { data: steps }] = await Promise.all([
    supabase
      .from('autoflow_templates')
      .select('id, name, description, type, total_steps, core_questions')
      .eq('id', templateId)
      .eq('coach_id', coachId)
      .single(),
    supabase
      .from('autoflow_template_steps')
      .select('step_number, title, description, questions, day_offset, trigger_type, trigger_step_number, resource_ids, form_id, form_save_to_file, tasks')
      .eq('template_id', templateId)
      .order('step_number'),
  ])

  if (!template) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ...template, steps: steps ?? [] })
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { templateId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, core_questions, steps, push_to_clients } = await req.json()
  const supabase = await createClient()

  const { data: tpl } = await supabase
    .from('autoflow_templates')
    .select('id')
    .eq('id', templateId)
    .eq('coach_id', coachId)
    .single()
  if (!tpl) return Response.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('autoflow_templates')
    .update({ name, description: description ?? null, core_questions: core_questions ?? [], updated_at: new Date().toISOString() })
    .eq('id', templateId)

  if (Array.isArray(steps)) {
    const stepRows = steps.map((s: { step_number: number; title: string; description?: string; questions: unknown[]; day_offset: number; trigger_type?: string; trigger_step_number?: number | null; resource_ids?: unknown[]; form_id?: string | null; form_save_to_file?: boolean; tasks?: unknown[] }) => ({
      template_id: templateId,
      step_number: s.step_number,
      title: s.title ?? '',
      description: s.description ?? null,
      questions: s.questions ?? [],
      day_offset: s.day_offset ?? 0,
      trigger_type: s.trigger_type ?? 'day_offset',
      trigger_step_number: s.trigger_step_number ?? null,
      resource_ids: s.resource_ids ?? [],
      form_id: s.form_id ?? null,
      form_save_to_file: s.form_save_to_file ?? false,
      tasks: s.tasks ?? [],
    }))
    await supabase
      .from('autoflow_template_steps')
      .upsert(stepRows, { onConflict: 'template_id,step_number' })
  }

  // Push name + regenerate calendar events for active client flows
  if (push_to_clients) {
    // Update flow names
    await supabase
      .from('client_autoflows')
      .update({ name })
      .eq('template_id', templateId)
      .eq('coach_id', coachId)
      .eq('status', 'active')

    // Regenerate calendar events for each active flow based on updated step titles/offsets
    if (Array.isArray(steps)) {
      const { data: activeFlows } = await supabase
        .from('client_autoflows')
        .select('id, client_id, start_date')
        .eq('template_id', templateId)
        .eq('coach_id', coachId)
        .eq('status', 'active')

      if (activeFlows && activeFlows.length > 0) {
        for (const flow of activeFlows) {
          // Fetch per-step due_date overrides for this client flow
          const { data: overrides } = await supabase
            .from('client_autoflow_step_overrides')
            .select('step_number, due_date')
            .eq('client_autoflow_id', flow.id)

          const overrideDates: Record<number, string> = Object.fromEntries(
            (overrides ?? []).filter(o => o.due_date).map(o => [o.step_number, o.due_date])
          )

          // Delete old autoflow calendar events for this flow
          await supabase
            .from('calendar_events')
            .delete()
            .eq('coach_id', coachId)
            .eq('client_id', flow.client_id)
            .eq('type', 'autoflow')
            .filter('content->>flow_id', 'eq', flow.id)

          // Recreate with updated titles and offsets
          const startMs = new Date(flow.start_date).getTime()
          const events = steps.map((s: { step_number: number; title?: string; day_offset: number }) => ({
            coach_id: coachId,
            client_id: flow.client_id,
            event_date: overrideDates[s.step_number]
              ?? new Date(startMs + s.day_offset * 86400000).toISOString().split('T')[0],
            type: 'autoflow',
            title: `${name} — Step ${s.step_number}${s.title ? `: ${s.title}` : ''}`,
            content: { flow_id: flow.id, step_number: s.step_number, link: `/autoflows/${flow.id}/${s.step_number}` },
          }))
          await supabase.from('calendar_events').insert(events)
        }
      }
    }
  }

  return Response.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { templateId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  await supabase
    .from('autoflow_templates')
    .delete()
    .eq('id', templateId)
    .eq('coach_id', coachId)

  return Response.json({ ok: true })
}

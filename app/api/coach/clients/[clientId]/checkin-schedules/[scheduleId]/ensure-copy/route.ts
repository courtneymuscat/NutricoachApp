import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ clientId: string; scheduleId: string }> }

// POST /api/coach/clients/[clientId]/checkin-schedules/[scheduleId]/ensure-copy
// Guarantees the schedule's form_id points to a client-specific copy, not a shared template.
// If it already is a copy, returns the existing form_id unchanged.
// If it points to a template, clones it and updates the schedule.
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { clientId, scheduleId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify the schedule belongs to this coach + client
  const { data: schedule } = await admin
    .from('checkin_schedules')
    .select('id, form_id, title')
    .eq('id', scheduleId)
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .single()

  if (!schedule) return Response.json({ error: 'Not found' }, { status: 404 })
  if (!schedule.form_id) return Response.json({ error: 'No form attached to this schedule' }, { status: 400 })

  // Check if the form is already a client copy
  const { data: form } = await admin
    .from('forms')
    .select('id, is_client_copy, title, description, type')
    .eq('id', schedule.form_id)
    .single()

  if (!form) return Response.json({ error: 'Form not found' }, { status: 404 })

  // Already a client copy — nothing to do
  if (form.is_client_copy) {
    return Response.json({ form_id: form.id })
  }

  // It's a template — clone it as a client-specific copy
  const { data: clonedForm, error: cloneErr } = await admin
    .from('forms')
    .insert({
      coach_id: coachId,
      client_id: clientId,
      title: form.title,
      description: form.description,
      type: form.type,
      is_client_copy: true,
      is_active: true,
    })
    .select('id')
    .single()

  if (cloneErr || !clonedForm) return Response.json({ error: cloneErr?.message ?? 'Clone failed' }, { status: 500 })

  // Copy all questions
  const { data: questions } = await admin
    .from('form_questions')
    .select('order_index, label, description, type, options, required')
    .eq('form_id', schedule.form_id)
    .order('order_index')

  if (questions?.length) {
    await admin.from('form_questions').insert(
      questions.map((q) => ({ ...q, form_id: clonedForm.id }))
    )
  }

  // Update the schedule to point to the new client copy
  await admin
    .from('checkin_schedules')
    .update({ form_id: clonedForm.id })
    .eq('id', scheduleId)

  return Response.json({ form_id: clonedForm.id })
}

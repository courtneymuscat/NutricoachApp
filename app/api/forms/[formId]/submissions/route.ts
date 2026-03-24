import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ formId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { formId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: form } = await supabase.from('forms').select('id').eq('id', formId).eq('coach_id', coachId).single()
  if (!form) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('id, client_id, submitted_at, viewed_by_coach')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })

  if (!submissions?.length) return Response.json([])

  const clientIds = [...new Set(submissions.map((s) => s.client_id))]
  const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', clientIds)
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.email]))

  return Response.json(
    submissions.map((s) => ({
      ...s,
      client_email: profileMap[s.client_id] ?? 'Unknown',
    }))
  )
}

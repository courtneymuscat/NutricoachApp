import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ clientId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify coach-client relationship with regular client (RLS-checked)
  const supabase = await createClient()
  const { data: rel } = await supabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .in('status', ['active', 'archived'])
    .single()
  if (!rel) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Use admin client — coach reading another user's submissions is blocked by RLS
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('form_submissions')
    .select(`
      id,
      created_at,
      forms ( title ),
      form_answers (
        value,
        form_questions ( label, type )
      )
    `)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Flatten to just file_upload answers with a valid URL
  const files: { url: string; label: string; formTitle: string; submittedAt: string }[] = []

  for (const submission of data ?? []) {
    const formsField = submission.forms as unknown as { title: string } | { title: string }[] | null
    const formTitle = (Array.isArray(formsField) ? formsField[0] : formsField)?.title ?? 'Form'
    const answers = submission.form_answers as unknown as { value: string; form_questions: { label: string; type: string } | null }[]
    for (const answer of answers ?? []) {
      const q = answer.form_questions
      if (q?.type === 'file_upload' && answer.value?.startsWith('http')) {
        files.push({ url: answer.value, label: q.label, formTitle, submittedAt: submission.created_at })
      }
    }
  }

  return Response.json(files)
}

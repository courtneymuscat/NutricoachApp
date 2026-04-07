import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ formId: string }> }

// GET /api/forms/[formId]/my-submission
// Returns the most recent submission + answers for the authenticated user on this form.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { formId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: submission } = await admin
    .from('form_submissions')
    .select('id, submitted_at')
    .eq('form_id', formId)
    .eq('client_id', session.user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!submission) return Response.json({ submission_id: null, answers: {} })

  const { data: answerRows } = await admin
    .from('form_answers')
    .select('question_id, value')
    .eq('submission_id', submission.id)

  const answers: Record<string, string> = {}
  for (const row of answerRows ?? []) {
    answers[row.question_id] = row.value
  }

  return Response.json({ submission_id: submission.id, submitted_at: submission.submitted_at, answers })
}

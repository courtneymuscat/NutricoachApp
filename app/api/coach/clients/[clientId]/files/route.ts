import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ clientId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify coach-client relationship (RLS-checked)
  const supabase = await createClient()
  const { data: rel } = await supabase
    .from('coach_clients')
    .select('id')
    .eq('coach_id', coachId)
    .eq('client_id', clientId)
    .in('status', ['active', 'archived', 'pending_invite'])
    .single()
  if (!rel) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Admin client — coach reading another user's data is blocked by RLS
  const admin = createAdminClient()

  // Try to read the save_to_file flag (added in a recent migration). If the
  // column doesn't exist yet, fall back gracefully so the Files tab still
  // works on older databases.
  let submissionsData: unknown[] = []
  const withFlag = await admin
    .from('form_submissions')
    .select('id, form_id, submitted_at, save_to_file, forms ( title ), form_answers ( value, form_questions ( label, type ) )')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('submitted_at', { ascending: false })
  if (withFlag.error && /save_to_file/i.test(withFlag.error.message)) {
    const fallback = await admin
      .from('form_submissions')
      .select('id, form_id, submitted_at, forms ( title ), form_answers ( value, form_questions ( label, type ) )')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .order('submitted_at', { ascending: false })
    submissionsData = (fallback.data ?? []) as unknown[]
  } else {
    submissionsData = (withFlag.data ?? []) as unknown[]
  }

  const { data: coachFilesData } = await admin
    .from('client_files')
    .select('id, url, name, created_at, uploaded_by')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  const files: { id?: string; url: string; label: string; formTitle: string; submittedAt: string; source: string; saveToFile?: boolean }[] = []

  // Form submissions: one entry per submission (links to response viewer) + any uploaded files
  for (const submission of submissionsData) {
    const s = submission as Record<string, unknown>
    const formsField = s.forms as { title: string } | { title: string }[] | null
    const formTitle = (Array.isArray(formsField) ? formsField[0] : formsField)?.title ?? 'Form'
    const formId = s.form_id as string
    const saveToFile = s.save_to_file === true

    // Add the form submission itself as a viewable entry
    files.push({
      url: `/coach/forms/${formId}/responses/${s.id}`,
      label: formTitle,
      formTitle: saveToFile ? 'Saved to file' : 'Form response',
      submittedAt: (s.submitted_at as string | null) ?? '',
      source: 'form',
      saveToFile,
    })

    // Also surface any file uploads from answers as separate entries
    const answers = s.form_answers as { value: string; form_questions: { label: string; type: string } | { label: string; type: string }[] | null }[] | null
    for (const answer of answers ?? []) {
      const q = Array.isArray(answer.form_questions) ? answer.form_questions[0] : answer.form_questions
      if (q?.type === 'file_upload' && answer.value?.startsWith('http')) {
        files.push({ url: answer.value, label: q.label, formTitle, submittedAt: (s.submitted_at as string | null) ?? '', source: 'client' })
      }
    }
  }

  // Files uploaded directly by coach
  for (const f of coachFilesData ?? []) {
    files.push({ id: f.id, url: f.url, label: f.name, formTitle: 'Coach upload', submittedAt: f.created_at, source: 'coach' })
  }

  files.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  return Response.json(files)
}

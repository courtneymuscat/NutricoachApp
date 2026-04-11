import { redirect } from 'next/navigation'
import { requireCoach } from '@/lib/coach'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DeleteSubmissionButton from './DeleteSubmissionButton'

type Ctx = { params: Promise<{ formId: string; submissionId: string }> }

// Supabase returns the related row as a single object for many-to-one joins
type QuestionRef = {
  label: string
  description: string | null
  type: string
  order_index: number
} | null

const BUBBLE_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function AnswerDisplay({ value, type }: { value: string; type: string }) {
  if (!value) {
    return <span className="text-gray-400 italic text-sm">No answer</span>
  }

  // Choice / yes-no: render as colored bubble
  if (type === 'choice' || type === 'yesno') {
    const colorIdx = Math.abs(value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % BUBBLE_COLORS.length
    const color = type === 'yesno'
      ? (value === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
      : BUBBLE_COLORS[colorIdx]
    return (
      <div>
        <span className={`inline-block px-4 py-1.5 rounded-xl text-sm font-medium ${color}`}>
          {value}
        </span>
      </div>
    )
  }

  // Scale: render as a numbered circle
  if (type === 'scale') {
    return (
      <div className="flex items-center gap-2">
        <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 text-base font-bold flex items-center justify-center">
          {value}
        </span>
        <span className="text-xs text-gray-400">out of 10</span>
      </div>
    )
  }

  // Text / textarea: plain
  return <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
}

export default async function SubmissionDetailPage({ params }: Ctx) {
  const { formId, submissionId } = await params
  const coachId = await requireCoach()
  if (!coachId) redirect('/dashboard')

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('form_submissions')
    .select('id, client_id, submitted_at, form_id')
    .eq('id', submissionId)
    .eq('coach_id', coachId)
    .single()

  if (!sub) redirect(`/coach/forms/${formId}/responses`)

  await admin.from('form_submissions').update({ viewed_by_coach: true }).eq('id', submissionId)

  const [{ data: answers }, { data: profile }, { data: form }] = await Promise.all([
    admin
      .from('form_answers')
      .select('question_id, value, form_questions(label, description, type, order_index)')
      .eq('submission_id', submissionId),
    admin.from('profiles').select('email').eq('id', sub.client_id).single(),
    admin.from('forms').select('title').eq('id', sub.form_id).single(),
  ])

  const sorted = (answers ?? []).sort((a, b) => {
    const oa = (a.form_questions as unknown as QuestionRef)?.order_index ?? 0
    const ob = (b.form_questions as unknown as QuestionRef)?.order_index ?? 0
    return oa - ob
  })

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <a href={`/coach/forms/${formId}/responses`} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{form?.title ?? 'Submission'}</h1>
          <p className="text-xs text-gray-400">
            {profile?.email} · {new Date(sub.submitted_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <DeleteSubmissionButton submissionId={submissionId} formId={formId} />
      </div>

      <main className="max-w-2xl mx-auto w-full p-6 space-y-3">
        {sorted.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No answers recorded.</p>
        )}
        {sorted.map((a, i) => {
          const q = a.form_questions as unknown as QuestionRef
          return (
            <div key={i} className="bg-white rounded-2xl border p-5 space-y-2">
              {/* Question label */}
              <p className="text-sm font-semibold text-gray-800">{q?.label ?? 'Question'}</p>
              {/* Description */}
              {q?.description && (
                <p className="text-xs text-gray-400 leading-relaxed">{q.description}</p>
              )}
              {/* Answer */}
              <AnswerDisplay value={a.value ?? ''} type={q?.type ?? 'text'} />
            </div>
          )
        })}
      </main>
    </div>
  )
}

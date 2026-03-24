import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function FormHistoryPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('id, form_id, submitted_at')
    .eq('client_id', session.user.id)
    .order('submitted_at', { ascending: false })

  const formIds = [...new Set((submissions ?? []).map((s) => s.form_id))]
  const { data: forms } = await supabase
    .from('forms')
    .select('id, title, type')
    .in('id', formIds.length ? formIds : ['none'])

  const formMap = Object.fromEntries((forms ?? []).map((f) => [f.id, f]))

  const TYPE_LABELS: Record<string, string> = {
    onboarding: 'Onboarding',
    weekly_checkin: 'Weekly check-in',
    custom: 'Custom',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Form History</h1>
          <p className="text-xs text-gray-400">{submissions?.length ?? 0} submission{submissions?.length !== 1 ? 's' : ''}</p>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-3">
        {(!submissions || submissions.length === 0) && (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-gray-500 font-medium">No submissions yet</p>
            <p className="text-gray-400 text-sm mt-1">Forms your coach sends you will appear here once submitted.</p>
          </div>
        )}

        {(submissions ?? []).map((sub) => {
          const form = formMap[sub.form_id]
          return (
            <div key={sub.id} className="bg-white rounded-2xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{form?.title ?? 'Form'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {form?.type && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[form.type] ?? form.type}
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}

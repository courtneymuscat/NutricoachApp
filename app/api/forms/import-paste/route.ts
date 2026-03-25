import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { title, text } = await req.json()
  if (!title?.trim() || !text?.trim()) {
    return Response.json({ error: 'Title and questions are required' }, { status: 400 })
  }

  // Parse lines — strip numbering like "1.", "1)", "Q1.", bullet points, dashes
  const lines = text
    .split('\n')
    .map((l: string) => l.replace(/^[\s\-•*–—]+/, '').replace(/^\d+[\.\)]\s*/, '').replace(/^Q\d+[\.\):]?\s*/i, '').trim())
    .filter((l: string) => l.length > 3)

  if (lines.length === 0) {
    return Response.json({ error: 'No questions detected — paste one question per line' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: form, error: formErr } = await supabase
    .from('forms')
    .insert({ coach_id: coachId, title: title.trim(), type: 'custom' })
    .select('id')
    .single()

  if (formErr || !form) {
    return Response.json({ error: formErr?.message ?? 'Failed to create form' }, { status: 500 })
  }

  const questions = lines.map((label: string, i: number) => ({
    form_id: form.id,
    order_index: i,
    label,
    type: 'text',
    options: null,
    required: false,
  }))

  const { error: qErr } = await supabase.from('form_questions').insert(questions)
  if (qErr) return Response.json({ error: qErr.message }, { status: 500 })

  return Response.json({ id: form.id, questionCount: lines.length })
}

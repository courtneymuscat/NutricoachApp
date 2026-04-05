import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type FeedbackItem = { id: string; coachNote: string }

// PATCH /api/workouts/program-session/[eventId]/feedback
// Coach adds technique feedback notes to exercises/sections in a workout result.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { exerciseFeedback, sectionFeedback } = await req.json() as {
    exerciseFeedback?: FeedbackItem[]
    sectionFeedback?: FeedbackItem[]
  }

  const admin = createAdminClient()

  const { data: event, error: fetchErr } = await admin
    .from('calendar_events')
    .select('*')
    .eq('id', eventId)
    .eq('coach_id', coachId)
    .single()

  if (fetchErr || !event) return Response.json({ error: 'Not found' }, { status: 404 })

  const content = event.content as Record<string, unknown>
  const exercises = (content.exercises ?? []) as Array<Record<string, unknown>>
  const sections  = (content.sections  ?? []) as Array<Record<string, unknown>>

  const updatedExercises = exercises.map((ex) => {
    const fb = exerciseFeedback?.find((f) => f.id === ex.id)
    return fb !== undefined ? { ...ex, coachNote: fb.coachNote } : ex
  })

  const updatedSections = sections.map((sec) => {
    const fb = sectionFeedback?.find((f) => f.id === sec.id)
    return fb !== undefined ? { ...sec, coachNote: fb.coachNote } : sec
  })

  const { data, error } = await admin
    .from('calendar_events')
    .update({ content: { ...content, exercises: updatedExercises, sections: updatedSections } })
    .eq('id', eventId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

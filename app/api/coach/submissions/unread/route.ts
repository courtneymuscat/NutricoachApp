import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ count: 0 })

  const supabase = await createClient()
  const { count } = await supabase
    .from('form_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .eq('viewed_by_coach', false)

  return Response.json({ count: count ?? 0 })
}

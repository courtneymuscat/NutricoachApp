import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { goal, activity_level, dietary_preference, first_name } = await req.json()

  if (!goal) return Response.json({ error: 'Goal is required' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({
      goal,
      activity_level: activity_level || null,
      dietary_preference: dietary_preference || null,
      first_name: first_name?.trim() || null,
      onboarding_completed: true,
    })
    .eq('id', session.user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

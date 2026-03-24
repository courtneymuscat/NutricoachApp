import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { email } = await req.json()
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  const supabase = await createClient()

  // Check for an existing pending invite to this email from this coach
  const { data: existing } = await supabase
    .from('coach_invites')
    .select('token')
    .eq('coach_id', coachId)
    .eq('email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existing) {
    const url = `${req.nextUrl.origin}/invite/${existing.token}`
    return Response.json({ url, token: existing.token })
  }

  const { data: invite, error } = await supabase
    .from('coach_invites')
    .insert({ coach_id: coachId, email })
    .select('token')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const url = `${req.nextUrl.origin}/invite/${invite.token}`
  return Response.json({ url, token: invite.token })
}

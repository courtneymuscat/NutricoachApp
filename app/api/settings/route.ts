import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', session.user.id)
    .single()

  return Response.json({ timezone: profile?.timezone ?? null })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { timezone } = await req.json()
  if (!timezone) return Response.json({ error: 'timezone required' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({ timezone })
    .eq('id', session.user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

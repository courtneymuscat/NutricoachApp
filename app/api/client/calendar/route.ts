import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

const ALLOWED_TYPES = ['personal', 'travel', 'extra_activity', 'note']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { event_date, type, title } = body

  if (!event_date || !title?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return Response.json({ error: 'Invalid event type' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('calendar_events')
    .insert({
      event_date,
      type,
      title: title.trim(),
      content: {},
      client_id: user.id,
      coach_id: null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

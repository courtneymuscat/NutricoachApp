import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, full_name, date_of_birth, phone, sex, subscription_tier')
    .eq('id', session.user.id)
    .single()

  return Response.json({
    timezone: profile?.timezone ?? null,
    full_name: (profile as Record<string, unknown>)?.full_name ?? null,
    date_of_birth: (profile as Record<string, unknown>)?.date_of_birth ?? null,
    phone: (profile as Record<string, unknown>)?.phone ?? null,
    sex: profile?.sex ?? null,
    subscription_tier: profile?.subscription_tier ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()

  // Allow patching timezone OR profile details (full_name, date_of_birth, phone)
  const allowed = ['timezone', 'full_name', 'date_of_birth', 'phone', 'sex']
  const update: Record<string, string> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) return Response.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', session.user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Sync birthday calendar events when date_of_birth changes
  if ('date_of_birth' in body) {
    const admin = createAdminClient()
    // Remove any existing birthday events for this user
    await admin
      .from('calendar_events')
      .delete()
      .eq('client_id', session.user.id)
      .eq('type', 'birthday')

    const dob = body.date_of_birth
    if (dob) {
      const [, month, day] = (dob as string).split('-').map(Number)
      const now = new Date()
      const thisYear = now.getFullYear()
      const dates: string[] = []
      // Create for current year and next 2 years so it shows ahead in the calendar
      for (let y = thisYear; y <= thisYear + 2; y++) {
        const d = new Date(y, month - 1, day)
        dates.push(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
      }
      await admin.from('calendar_events').insert(
        dates.map((event_date) => ({
          event_date,
          type: 'birthday',
          title: 'Birthday',
          content: {},
          client_id: session.user.id,
          coach_id: null,
        }))
      )
    }
  }

  return Response.json({ ok: true })
}

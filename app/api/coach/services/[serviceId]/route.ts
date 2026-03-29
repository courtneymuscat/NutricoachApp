import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ serviceId: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { serviceId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { name, description, price_label, payment_link } = await req.json()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_services')
    .update({
      name: name?.trim() || undefined,
      description: description?.trim() || null,
      price_label: price_label?.trim() || null,
      payment_link: payment_link?.trim() || undefined,
    })
    .eq('id', serviceId)
    .eq('coach_id', coachId)
    .select('id, name, description, price_label, payment_link, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { serviceId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('coach_services')
    .delete()
    .eq('id', serviceId)
    .eq('coach_id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

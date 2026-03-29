import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

export async function GET() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_services')
    .select('id, name, description, price_label, payment_link, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const { name, description, price_label, payment_link } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
  if (!payment_link?.trim()) return Response.json({ error: 'Payment link required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coach_services')
    .insert({
      coach_id: coachId,
      name: name.trim(),
      description: description?.trim() || null,
      price_label: price_label?.trim() || null,
      payment_link: payment_link.trim(),
    })
    .select('id, name, description, price_label, payment_link, created_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

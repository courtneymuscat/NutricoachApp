import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/coach'
import type { NextRequest } from 'next/server'

type MealFood = { calories?: number; protein?: number; carbs?: number; fat?: number }
type MealSlot = { foods?: MealFood[] }

function computeMacros(content: unknown) {
  let calories = 0, protein = 0, carbs = 0, fat = 0
  for (const slot of (Array.isArray(content) ? content : []) as MealSlot[]) {
    for (const food of (Array.isArray(slot?.foods) ? slot.foods : []) as MealFood[]) {
      calories += Number(food?.calories) || 0
      protein  += Number(food?.protein)  || 0
      carbs    += Number(food?.carbs)    || 0
      fat      += Number(food?.fat)      || 0
    }
  }
  return {
    target_calories: Math.round(calories),
    target_protein:  Math.round(protein),
    target_carbs:    Math.round(carbs),
    target_fat:      Math.round(fat),
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; planId: string }> }
) {
  const { clientId, planId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_meal_plans')
    .select('*')
    .eq('id', planId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; planId: string }> }
) {
  const { clientId, planId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()
  const { name, content, status, total_calories } = body
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (content !== undefined) updates.content = content
  if (status !== undefined) updates.status = status
  if (total_calories !== undefined) updates.total_calories = total_calories

  const { data, error } = await supabase
    .from('client_meal_plans')
    .update(updates)
    .eq('id', planId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .select()
    .single()

  if (error || !data) return Response.json({ error: error?.message ?? 'Not found' }, { status: 400 })

  // If content changed and plan is still active, sync client's daily targets
  if (content !== undefined && (status ?? data.status) === 'active') {
    const macros = computeMacros(content)
    if (macros.target_calories > 0) {
      const admin = createAdminClient()
      await admin.from('profiles').update(macros).eq('id', clientId)
    }
  }

  return Response.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; planId: string }> }
) {
  const { clientId, planId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('client_meal_plans')
    .delete()
    .eq('id', planId)
    .eq('client_id', clientId)
    .eq('coach_id', coachId)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

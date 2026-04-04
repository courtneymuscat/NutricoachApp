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
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('client_meal_plans')
    .select('*')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  return Response.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()
  const { meal_plan_id, name, content, start_date } = body

  const { data, error } = await supabase
    .from('client_meal_plans')
    .insert({
      meal_plan_id: meal_plan_id ?? null,
      name,
      content,
      start_date,
      client_id: clientId,
      coach_id: coachId,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Sync client's daily targets to match this meal plan's macros
  const macros = computeMacros(content)
  if (macros.target_calories > 0) {
    const admin = createAdminClient()
    await admin.from('profiles').update(macros).eq('id', clientId)
  }

  return Response.json(data)
}

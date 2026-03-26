import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const {
    goal, first_name, age, sex, height_cm, weight_kg,
    dietary_preference, steps_per_day, activities,
    tdee, target_calories, target_protein, target_carbs, target_fat,
  } = await req.json()

  if (!goal) return Response.json({ error: 'Goal is required' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({
      goal,
      first_name:          first_name ?? null,
      age:                 age ?? null,
      sex:                 sex ?? null,
      height_cm:           height_cm ?? null,
      weight_kg:           weight_kg ?? null,
      dietary_preference:  dietary_preference ?? null,
      steps_per_day:       steps_per_day ?? null,
      activities:          activities ?? [],
      tdee:                tdee ?? null,
      target_calories:     target_calories ?? null,
      target_protein:      target_protein ?? null,
      target_carbs:        target_carbs ?? null,
      target_fat:          target_fat ?? null,
      onboarding_completed: true,
    })
    .eq('id', session.user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

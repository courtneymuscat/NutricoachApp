import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const {
    goal, first_name, age, sex, height_cm, weight_kg,
    dietary_preference, steps_per_day, activities,
    tdee, target_calories, target_protein, target_carbs, target_fat,
    adjustment_pct,
  } = await req.json()

  if (!goal) return Response.json({ error: 'Goal is required' }, { status: 400 })

  // Use service client so the upsert is never blocked by RLS
  const service = createServiceClient()
  const { error } = await service
    .from('profiles')
    .upsert({
      id:                  session.user.id,
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
      adjustment_pct:      adjustment_pct ?? null,
      onboarding_completed: true,
    }, { onConflict: 'id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

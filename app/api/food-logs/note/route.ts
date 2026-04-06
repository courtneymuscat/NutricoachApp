import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

// PATCH /api/food-logs/note
// Update meal_notes text on a food_logs row. Uses admin client to bypass RLS.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { food_log_id, meal_notes } = body

  if (!food_log_id) {
    return Response.json({ error: 'food_log_id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the food log belongs to this user
  const { data: log } = await admin
    .from('food_logs')
    .select('id')
    .eq('id', food_log_id)
    .eq('user_id', session.user.id)
    .single()

  if (!log) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('food_logs')
    .update({ meal_notes: meal_notes?.trim() || null })
    .eq('id', food_log_id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

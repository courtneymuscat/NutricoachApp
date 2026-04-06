import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

// POST /api/food-logs/photo
// After client-side upload to storage, call this to create a signed URL
// and persist it to food_logs.meal_photo_url using the admin client.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { food_log_id, photo_path } = body

  if (!food_log_id || !photo_path) {
    return Response.json({ error: 'food_log_id and photo_path are required' }, { status: 400 })
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

  // Create signed URL server-side (reliable via admin client)
  const { data: signed, error: signError } = await admin.storage
    .from('meal-photos')
    .createSignedUrl(photo_path, 315360000) // ~10 years

  if (signError || !signed?.signedUrl) {
    return Response.json({ error: signError?.message ?? 'Failed to create signed URL' }, { status: 500 })
  }

  const { error } = await admin
    .from('food_logs')
    .update({ meal_photo_url: signed.signedUrl })
    .eq('id', food_log_id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ photo_url: signed.signedUrl })
}

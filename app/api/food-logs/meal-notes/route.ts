import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

// POST /api/food-logs/meal-notes
// Upsert a meal-level note (text and/or photo_path) for the authenticated user.
// Uses admin client to bypass RLS.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { log_date, meal_type, note, photo_path } = body

  if (!log_date || !meal_type) {
    return Response.json({ error: 'log_date and meal_type are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve signed URL if a storage path was provided
  let photo_url: string | undefined
  if (photo_path) {
    const { data: signed } = await admin.storage
      .from('meal-photos')
      .createSignedUrl(photo_path, 315360000) // ~10 years
    if (signed?.signedUrl) photo_url = signed.signedUrl
  }

  const upsertData: Record<string, unknown> = {
    user_id: session.user.id,
    log_date,
    meal_type,
  }
  if (note !== undefined) upsertData.note = note?.trim() || null
  if (photo_url !== undefined) upsertData.photo_url = photo_url

  const { error } = await admin
    .from('meal_notes')
    .upsert(upsertData, { onConflict: 'user_id,log_date,meal_type' })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}

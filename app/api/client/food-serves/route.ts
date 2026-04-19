import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/client/food-serves
// Returns coach's food→category map so the client can resolve serve categories when logging
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ map: {} })

  const admin = createAdminClient()

  // Find this client's active coach
  const { data: rel } = await admin
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', session.user.id)
    .eq('status', 'active')
    .single()

  if (!rel) return NextResponse.json({ map: {} })

  const { data: tags } = await admin
    .from('coach_food_serves')
    .select('food_name, serve_category, secondary_categories')
    .eq('coach_id', rel.coach_id)

  // Return as lowercased name → category map for fast client-side lookup
  const map: Record<string, { category: string; secondary: string[] }> = {}
  for (const t of tags ?? []) {
    map[t.food_name.toLowerCase()] = {
      category: t.serve_category,
      secondary: t.secondary_categories ?? [],
    }
  }

  return NextResponse.json({ map })
}

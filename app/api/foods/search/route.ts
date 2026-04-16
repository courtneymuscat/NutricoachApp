import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// This route only searches the local database.
// Open Food Facts is called directly from the browser (see FoodSearch.tsx)
// to avoid server-side rate limiting.

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json([])

  const supabase = await createClient()

  const [
    { data: dbStarts },
    { data: dbContains },
    { data: customFoods },
  ] = await Promise.all([
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `${q}%`)
      .order('name')
      .limit(8),
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(12),
    supabase
      .from('foods')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(5),
  ])

  const custom = (customFoods ?? []).map((f) => ({ ...f, custom: true }))
  const seen = new Set<string>()
  const merged = []
  for (const food of [...custom, ...(dbStarts ?? []), ...(dbContains ?? [])]) {
    const key = String(food.id)
    if (!seen.has(key)) { seen.add(key); merged.push(food) }
    if (merged.length >= 15) break
  }

  return Response.json(merged)
}

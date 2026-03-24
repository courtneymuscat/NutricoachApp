import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json([])

  const supabase = await createClient()

  const [
    { data: dbStarts },
    { data: dbContains },
    { data: customFoods },
  ] = await Promise.all([
    // Exact starts-with matches (highest priority)
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `${q}%`)
      .order('name')
      .limit(8),
    // Broader contains matches (lower priority)
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(12),
    // User's personal foods
    supabase
      .from('foods')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(5),
  ])

  // Merge: personal foods first, then starts-with, then contains — deduplicate by id
  const custom = (customFoods ?? []).map((f) => ({ ...f, custom: true }))
  const seen = new Set<string>()
  const merged = []
  for (const food of [...custom, ...(dbStarts ?? []), ...(dbContains ?? [])]) {
    const key = String(food.id)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(food)
    }
    if (merged.length >= 12) break
  }

  return Response.json(merged)
}

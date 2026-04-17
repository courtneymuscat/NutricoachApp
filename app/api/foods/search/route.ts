import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// This route only searches the local database.
// Open Food Facts is called directly from the browser (see FoodSearch.tsx)
// to avoid server-side rate limiting.

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json([])

  const supabase = await createClient()

  // For multi-word queries (e.g. "chicken raw"), search each word individually
  // so "Chicken, raw breast" is found even though "chicken raw" isn't a substring.
  const terms = q.split(/\s+/).filter(t => t.length >= 2)
  const primaryTerm = terms[0]

  const [
    { data: dbStarts },
    { data: dbContains },
    { data: customFoods },
  ] = await Promise.all([
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `${primaryTerm}%`)
      .order('name')
      .limit(20),
    supabase
      .from('food_database')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${primaryTerm}%`)
      .order('name')
      .limit(30),
    supabase
      .from('foods')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit')
      .ilike('name', `%${primaryTerm}%`)
      .order('name')
      .limit(10),
  ])

  // Score each DB result by how many query terms appear in the name,
  // then sort so all-terms matches come first.
  function scoreLocal(name: string): number {
    const n = name.toLowerCase()
    let s = 0
    for (const t of terms) if (n.includes(t.toLowerCase())) s++
    return s
  }

  const custom = (customFoods ?? []).map((f) => ({ ...f, custom: true }))
  const seen = new Set<string>()
  const merged: typeof custom = []
  for (const food of [...custom, ...(dbStarts ?? []), ...(dbContains ?? [])]) {
    const key = String(food.id)
    if (!seen.has(key)) { seen.add(key); merged.push(food as typeof custom[0]) }
  }

  merged.sort((a, b) => scoreLocal(b.name) - scoreLocal(a.name))

  return Response.json(merged.slice(0, 15))
}

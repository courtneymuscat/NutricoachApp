import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json([])

  const { data } = await supabase
    .from('user_food_history')
    .select('food_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, unit, logged_at')
    .eq('user_id', session.user.id)
    .order('logged_at', { ascending: false })
    .limit(40)

  // Deduplicate by food_id (or name), keep most recent occurrence. Also
  // drop entries where every nutrient is zero/missing — usually OFF
  // placeholders that snuck into history once and would clutter the
  // dropdown forever.
  const seen = new Set<string>()
  const unique = (data ?? []).filter((item) => {
    const key = item.food_id ?? item.name
    if (seen.has(key)) return false
    seen.add(key)
    const c = item.calories_per_100g ?? 0
    const p = item.protein_per_100g ?? 0
    const cb = item.carbs_per_100g ?? 0
    const ft = item.fat_per_100g ?? 0
    return c > 0 || p > 0 || cb > 0 || ft > 0
  }).slice(0, 10)

  // Map to FoodResult shape (id instead of food_id)
  const result = unique.map(({ food_id, logged_at, ...rest }) => ({ id: food_id ?? '', ...rest }))

  return Response.json(result)
}

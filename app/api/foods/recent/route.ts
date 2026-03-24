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

  // Deduplicate by food_id (or name), keep most recent occurrence
  const seen = new Set<string>()
  const unique = (data ?? []).filter((item) => {
    const key = item.food_id ?? item.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 10)

  // Map to FoodResult shape (id instead of food_id)
  const result = unique.map(({ food_id, logged_at, ...rest }) => ({ id: food_id ?? '', ...rest }))

  return Response.json(result)
}

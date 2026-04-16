import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, barcode, serving_sizes } = body

  if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('food_database')
    .insert({
      name: name.trim(),
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      barcode: barcode || null,
      serving_sizes: serving_sizes ?? [],
    })
    .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_sizes')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

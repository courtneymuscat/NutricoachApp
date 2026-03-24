import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim()
  if (!code) return Response.json(null)

  const supabase = await createClient()
  const { data } = await supabase
    .from('food_database')
    .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, barcode')
    .eq('barcode', code)
    .maybeSingle()

  return Response.json(data ?? null)
}

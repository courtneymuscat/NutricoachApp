import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const category = req.nextUrl.searchParams.get('category')
  if (!q || q.length < 2) return Response.json([])

  const supabase = await createClient()

  let query = supabase
    .from('exercises')
    .select('id, name, category, equipment, muscles, video_url')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return Response.json(data ?? [])
}

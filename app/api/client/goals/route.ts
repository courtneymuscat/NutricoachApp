import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('client_goals')
    .select('main_goal, mini_goals, updated_at')
    .eq('client_id', user.id)
    .maybeSingle()

  return Response.json(data ?? { main_goal: null, mini_goals: [] })
}

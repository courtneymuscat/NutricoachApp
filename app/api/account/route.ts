import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const userId = session.user.id
  const service = createServiceClient()

  // Delete user data rows (profile cascade may handle some, but be explicit)
  await service.from('food_logs').delete().eq('user_id', userId)
  await service.from('weight_logs').delete().eq('user_id', userId)
  await service.from('check_ins').delete().eq('user_id', userId)
  await service.from('cycle_logs').delete().eq('user_id', userId)
  await service.from('coach_clients').delete().or(`coach_id.eq.${userId},client_id.eq.${userId}`)
  await service.from('profiles').delete().eq('id', userId)

  // Delete auth user (must be last)
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

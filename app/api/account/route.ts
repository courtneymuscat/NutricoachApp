import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const userId = user.id
  const service = createServiceClient()

  // Delete user data rows explicitly before deleting auth user
  await service.from('food_logs').delete().eq('user_id', userId)
  await service.from('weight_logs').delete().eq('user_id', userId)
  await service.from('check_ins').delete().eq('user_id', userId)
  await service.from('cycle_logs').delete().eq('user_id', userId)
  await service.from('coach_clients').delete().or(`coach_id.eq.${userId},client_id.eq.${userId}`)

  // Delete profile last (foreign key references auth.users)
  const { error: profileError } = await service.from('profiles').delete().eq('id', userId)
  if (profileError) {
    console.error('Error deleting profile:', profileError.message)
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  // Delete auth user
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Error deleting auth user:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}

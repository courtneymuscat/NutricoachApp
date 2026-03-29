import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const userId = user.id
  const service = createServiceClient()

  // Cancel active Stripe subscription if exists
  const { data: profile } = await service
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_subscription_id) {
    try {
      const stripe = getStripe()
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch (err) {
      console.error('Error cancelling Stripe subscription:', err)
      // Non-fatal — continue with account deletion
    }
  }

  // Delete all user data rows first
  await service.from('food_logs').delete().eq('user_id', userId)
  await service.from('weight_logs').delete().eq('user_id', userId)
  await service.from('check_ins').delete().eq('user_id', userId)
  await service.from('cycle_logs').delete().eq('user_id', userId)
  await service.from('progress_photos').delete().eq('user_id', userId)
  await service.from('workouts').delete().eq('user_id', userId)
  await service.from('exercises').delete().eq('created_by', userId)
  await service.from('messages').delete().eq('sender_id', userId)
  await service.from('coach_clients').delete().or(`coach_id.eq.${userId},client_id.eq.${userId}`)
  await service.from('form_responses').delete().eq('user_id', userId)

  // Delete profile (FK to auth.users — must go before auth user deletion)
  await service.from('profiles').delete().eq('id', userId)

  // Delete auth user — cascades any remaining references
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Error deleting auth user:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}

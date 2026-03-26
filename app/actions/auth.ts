'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { acceptInvite } from '@/lib/coach'

type AuthState = { error?: string } | null

const FREE_PLANS = ['', 'individual_tier_1']

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const invite = (formData.get('invite') as string) || null
  const planKey = (formData.get('planKey') as string) || ''
  const billing = (formData.get('billing') as string) || 'monthly'
  const userType = (formData.get('userType') as string) || 'individual'

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.session?.user) {
    await supabase.from('profiles').insert({
      id: data.session.user.id,
      email: data.session.user.email,
      role: userType === 'coach' ? 'coach' : 'client',
      user_type: userType,
    })
    if (invite) await acceptInvite(invite, data.session.user.id)
  }

  // If a paid plan was selected, redirect to Stripe checkout
  if (planKey && !FREE_PLANS.includes(planKey)) {
    redirect(`/checkout?plan=${planKey}&billing=${billing}&type=${userType}`)
  }

  redirect('/onboarding')
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const invite = (formData.get('invite') as string) || null

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  if (invite && data.session?.user) {
    await acceptInvite(invite, data.session.user.id)
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

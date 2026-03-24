'use server'

import { createClient } from '@/lib/supabase/server'
import { refresh } from 'next/cache'

type DataState = { error?: string; success?: boolean } | null

export async function saveFoodLog(prevState: DataState, formData: FormData): Promise<DataState> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { error } = await supabase.from('food_logs').insert({
    user_id: session.user.id,
    calories: Number(formData.get('calories')),
    protein: Number(formData.get('protein')),
    carbs: Number(formData.get('carbs')),
    fat: Number(formData.get('fat')),
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  refresh()
  return { success: true }
}

export async function saveCheckIn(prevState: DataState, formData: FormData): Promise<DataState> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'Not authenticated' }

  const { error } = await supabase.from('check_ins').insert({
    user_id: session.user.id,
    weight: Number(formData.get('weight')),
    mood: formData.get('mood') as string,
    adherence: Number(formData.get('adherence')),
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  refresh()
  return { success: true }
}

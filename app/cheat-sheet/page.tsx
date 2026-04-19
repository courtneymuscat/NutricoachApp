import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientCheatSheet from './ClientCheatSheet'

export default async function CheatSheetPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  return <ClientCheatSheet />
}

import { requireCoach } from '@/lib/coach'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import PrintClientCheatSheet from './PrintClientCheatSheet'

type Props = { params: Promise<{ clientId: string }> }

export default async function Page({ params }: Props) {
  const { clientId } = await params
  const coachId = await requireCoach()
  if (!coachId) redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: link }, { data: profile }] = await Promise.all([
    admin
      .from('coach_clients')
      .select('client_id')
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .maybeSingle(),
    admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', clientId)
      .maybeSingle(),
  ])

  if (!link) notFound()

  const clientName = profile?.full_name?.trim() || profile?.email || 'Client'

  return <PrintClientCheatSheet clientId={clientId} clientName={clientName} />
}

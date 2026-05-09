import { redirect, notFound } from 'next/navigation'
import { requireCoach } from '@/lib/coach'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrgForUser } from '@/lib/org'
import { seedCoachTemplates } from '@/lib/seed-coach-templates'
import MealPlanEditor from './MealPlanEditor'

export default async function MealPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const coachId = await requireCoach()
  if (!coachId) redirect('/dashboard')

  // Run seed check so template content (labels, notes) stays up to date
  await seedCoachTemplates(coachId)

  const supabase = await createClient()
  // First try to load as the coach's own row
  const { data: own } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('id', id)
    .eq('coach_id', coachId)
    .maybeSingle()

  if (own) return <MealPlanEditor plan={own} />

  // Fall back to an org template the coach has access to (read-only view)
  const membership = await getOrgForUser(coachId)
  if (membership && membership.role !== 'owner') {
    const admin = createAdminClient()
    const { data: orgPlan } = await admin
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .eq('org_id', membership.org_id)
      .eq('is_org_template', true)
      .maybeSingle()

    if (orgPlan) {
      return <MealPlanEditor plan={orgPlan} readOnly orgName={membership.org_name} />
    }
  }

  notFound()
}

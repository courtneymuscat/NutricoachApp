import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrgRole } from '@/lib/org'
import type { NextRequest } from 'next/server'

/**
 * DELETE /api/org/coaches/[coachId]
 * Removes a coach from the organisation. Requires owner or admin role.
 * - Deactivates the org_members row
 * - Clears org_id on the coach's profile
 * Cannot be used to remove yourself or the org owner.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> },
) {
  const { coachId } = await params

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  if (coachId === session.user.id) {
    return Response.json({ error: 'You cannot remove yourself from the organisation' }, { status: 400 })
  }

  let membership
  try {
    membership = await requireOrgRole(session.user.id, 'admin')
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Verify the target coach is in the same org
  const { data: target } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', membership.org_id)
    .eq('user_id', coachId)
    .eq('is_active', true)
    .single()

  if (!target) {
    return Response.json({ error: 'Coach not found in this organisation' }, { status: 404 })
  }
  if (target.role === 'owner') {
    return Response.json({ error: 'Cannot remove the organisation owner' }, { status: 400 })
  }

  // Deactivate membership
  await admin
    .from('org_members')
    .update({ is_active: false })
    .eq('org_id', membership.org_id)
    .eq('user_id', coachId)

  // Clear org_id from their profile
  await admin
    .from('profiles')
    .update({ org_id: null })
    .eq('id', coachId)

  return Response.json({ ok: true })
}

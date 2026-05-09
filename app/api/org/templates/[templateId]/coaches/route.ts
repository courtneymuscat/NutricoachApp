import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrgRole } from '@/lib/org'
import { collectAutoflowDependencies } from '../../route'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ templateId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { templateId } = await params
  const table = req.nextUrl.searchParams.get('table')
  if (!table) return Response.json({ error: 'table query param required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  let membership
  try {
    membership = await requireOrgRole(session.user.id, 'admin')
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [membersResult, exclusionsResult, profilesResult] = await Promise.all([
    admin
      .from('org_members')
      .select('user_id, role')
      .eq('org_id', membership.org_id)
      .eq('is_active', true),
    admin
      .from('org_template_exclusions')
      .select('coach_id')
      .eq('org_id', membership.org_id)
      .eq('template_id', templateId)
      .eq('template_table', table),
    admin
      .from('profiles')
      .select('id, full_name, email'),
  ])

  const excludedIds = new Set((exclusionsResult.data ?? []).map((e) => e.coach_id))
  const profileMap = Object.fromEntries((profilesResult.data ?? []).map((p) => [p.id, p]))

  const coaches = (membersResult.data ?? []).map((m) => ({
    id: m.user_id,
    role: m.role,
    full_name: profileMap[m.user_id]?.full_name ?? null,
    email: profileMap[m.user_id]?.email ?? null,
    excluded: excludedIds.has(m.user_id),
  }))

  return Response.json(coaches)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { templateId } = await params

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  let membership
  try {
    membership = await requireOrgRole(session.user.id, 'admin')
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Forbidden' }, { status: 403 })
  }

  const { coach_id, table, excluded } = await req.json() as {
    coach_id: string
    table: string
    excluded: boolean
  }
  if (!coach_id || !table) return Response.json({ error: 'coach_id and table required' }, { status: 400 })

  const admin = createAdminClient()

  // Build the list of (template_id, table) pairs whose access we should
  // mirror. For an autoflow we also propagate to its dependent forms +
  // resources so a coach gaining/losing access to the autoflow gets the same
  // change for everything it references — otherwise the autoflow breaks
  // mid-step when a referenced form becomes inaccessible.
  const targets: Array<{ id: string; table: string }> = [{ id: templateId, table }]
  if (table === 'autoflow_templates') {
    const { data: steps } = await admin
      .from('autoflow_template_steps')
      .select('form_id, resource_ids, tasks')
      .eq('template_id', templateId)
    const { formIds, resourceIds } = collectAutoflowDependencies(
      (steps as Array<{ form_id: string | null; resource_ids: string[] | null; tasks: unknown }>) ?? [],
    )
    for (const id of formIds) targets.push({ id, table: 'forms' })
    for (const id of resourceIds) targets.push({ id, table: 'coach_resources' })
  }

  if (excluded) {
    const rows = targets.map((t) => ({
      org_id: membership.org_id,
      template_id: t.id,
      template_table: t.table,
      coach_id,
    }))
    const { error } = await admin
      .from('org_template_exclusions')
      .upsert(rows, { onConflict: 'org_id,template_id,template_table,coach_id' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    // Delete exclusion rows for every (template_id, table) pair the toggle
    // affects. Keep these as separate eq()s rather than a single in() because
    // template_table is also part of the unique key.
    for (const t of targets) {
      const { error } = await admin
        .from('org_template_exclusions')
        .delete()
        .eq('org_id', membership.org_id)
        .eq('template_id', t.id)
        .eq('template_table', t.table)
        .eq('coach_id', coach_id)
      if (error) return Response.json({ error: error.message }, { status: 500 })
    }
  }

  return Response.json({ ok: true, propagated: targets.length - 1 })
}

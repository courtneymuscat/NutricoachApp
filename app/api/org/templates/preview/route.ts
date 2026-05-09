import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrgRole } from '@/lib/org'
import { collectAutoflowDependencies } from '../route'
import type { NextRequest } from 'next/server'

/**
 * GET /api/org/templates/preview?template_id=...&table=autoflow_templates
 *
 * Returns the forms + resources that would also become org-shared if the
 * given template is published. Used by the publish modal so the admin can
 * see exactly what they're sharing before they hit the button.
 *
 * For non-autoflow tables this is just an empty object — they have no
 * cross-table dependencies.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  let membership
  try {
    membership = await requireOrgRole(session.user.id, 'admin')
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const templateId = url.searchParams.get('template_id')
  const table = url.searchParams.get('table')
  if (!templateId || !table) {
    return Response.json({ error: 'template_id and table are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Only autoflows have cross-table dependencies right now.
  if (table !== 'autoflow_templates') {
    return Response.json({ dependencies: { forms: [], resources: [] } })
  }

  // Fetch steps including tasks so we can detect both step-level and task-linked refs.
  const { data: steps } = await admin
    .from('autoflow_template_steps')
    .select('form_id, resource_ids, tasks')
    .eq('template_id', templateId)

  const { formIds, resourceIds } = collectAutoflowDependencies(
    (steps as Array<{ form_id: string | null; resource_ids: string[] | null; tasks: unknown }>) ?? [],
  )

  // Resolve names + flag which are already shared (so the modal can dim them)
  const [formsRes, resourcesRes] = await Promise.all([
    formIds.size
      ? admin.from('forms').select('id, title, is_org_template, org_id').in('id', [...formIds])
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; is_org_template: boolean; org_id: string | null }> }),
    resourceIds.size
      ? admin.from('coach_resources').select('id, name, is_org_template, org_id').in('id', [...resourceIds])
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; is_org_template: boolean; org_id: string | null }> }),
  ])

  return Response.json({
    dependencies: {
      forms: (formsRes.data ?? []).map((f) => ({
        id: f.id,
        name: f.title,
        already_shared: !!(f.is_org_template && f.org_id === membership.org_id),
      })),
      resources: (resourcesRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        already_shared: !!(r.is_org_template && r.org_id === membership.org_id),
      })),
    },
  })
}

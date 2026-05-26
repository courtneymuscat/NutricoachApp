import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import { seedCoachTemplates } from '@/lib/seed-coach-templates'
import { fetchOrgTemplatesForCoach } from '@/lib/org'
import type { NextRequest } from 'next/server'

type ProgramRow = {
  id: string
  name: string
  description: string | null
  content: unknown
  created_at: string
  updated_at: string | null
  archived_at?: string | null
}

export async function GET(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const archivedView = new URL(req.url).searchParams.get('archived') === '1'

  // Auto-seed starter templates if they haven't been added yet
  if (!archivedView) await seedCoachTemplates(coachId)

  const [ownResult, orgItems] = await Promise.all([
    supabase
      .from('programs')
      .select('id, name, description, content, created_at, updated_at, archived_at')
      .eq('coach_id', coachId)
      .eq('is_org_template', false)
      .filter('archived_at', archivedView ? 'not.is' : 'is', null)
      .order(archivedView ? 'updated_at' : 'created_at', { ascending: false }),
    archivedView
      ? Promise.resolve([] as ProgramRow[])
      : fetchOrgTemplatesForCoach<ProgramRow>(
          coachId,
          'programs',
          'id, name, description, content, created_at, updated_at',
        ),
  ])

  if (ownResult.error) return Response.json({ error: ownResult.error.message }, { status: 500 })

  // Dedupe by id — coach-publisher rows otherwise appear once in 'own'
  // and once in orgItems. Prefer the org-template flag so the UI shows
  // the published badge.
  const byId = new Map<string, ProgramRow & { is_org_template: boolean }>()
  for (const p of (ownResult.data as ProgramRow[] | null) ?? []) {
    byId.set(p.id, { ...p, is_org_template: false })
  }
  for (const p of orgItems) {
    byId.set(p.id, { ...p, is_org_template: true })
  }
  const combined = Array.from(byId.values())

  // Shape response: replace content with week_count
  const programs = combined.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    week_count: Array.isArray(p.content) ? p.content.length : 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
    archived_at: p.archived_at ?? null,
    is_org_template: p.is_org_template,
  }))

  return Response.json(programs)
}

export async function POST(req: NextRequest) {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const name = (body?.name ?? '').trim()
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('programs')
    .insert({
      coach_id: coachId,
      name,
      description: (body?.description ?? '').trim() || null,
      content: [],
    })
    .select('id, name, description, created_at, updated_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

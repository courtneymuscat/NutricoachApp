import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/coach'
import { NextResponse } from 'next/server'

// DELETE /api/coach/cheat-sheet/custom/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const coachId = await requireCoach()
  if (!coachId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('coach_cheat_sheet')
    .delete()
    .eq('id', id)
    .eq('coach_id', coachId)
    .is('food_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

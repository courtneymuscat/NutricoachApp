import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/** POST — mark all messages in a conversation as read for the current user */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .neq('sender_id', session.user.id)
    .is('read_at', null)

  return Response.json({ ok: true })
}

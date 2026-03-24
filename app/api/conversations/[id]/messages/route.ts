import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

async function verifyAccess(supabase: Awaited<ReturnType<typeof createClient>>, conversationId: string, userId: string) {
  const { data } = await supabase
    .from('conversations')
    .select('id, coach_id, client_id')
    .eq('id', conversationId)
    .or(`coach_id.eq.${userId},client_id.eq.${userId}`)
    .single()
  return data
}

/** GET — fetch messages for a conversation */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  if (!(await verifyAccess(supabase, id, session.user.id))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, read_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(100)

  return Response.json(messages ?? [])
}

/** POST — send a message */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const convo = await verifyAccess(supabase, id, session.user.id)
  if (!convo) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { body } = await req.json()
  if (!body?.trim()) return Response.json({ error: 'Message body required' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: id, sender_id: session.user.id, body: body.trim() })
    .select('id, sender_id, body, created_at, read_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Update last_message_at on conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', id)

  return Response.json(message, { status: 201 })
}

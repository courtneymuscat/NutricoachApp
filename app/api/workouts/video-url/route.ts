import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

// GET /api/workouts/video-url?path=...&clientId=...
// Generates a signed URL for a workout video stored in the workout-videos bucket.
// Access rules:
//   - path starts with requesting user's own id → allowed
//   - clientId provided and requester is the client's coach → allowed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const clientId = searchParams.get('clientId') // only required for coach access

  if (!path) return Response.json({ error: 'Missing path' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const pathOwner = path.split('/')[0]

  if (pathOwner !== user.id) {
    // Requester is not the owner — verify they are the client's coach
    if (!clientId || pathOwner !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data: rel } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .in('status', ['active'])
      .single()
    if (!rel) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('workout-videos')
    .createSignedUrl(path, 3600) // 1 hour

  if (error || !data) return Response.json({ error: error?.message ?? 'Failed to generate URL' }, { status: 400 })
  return Response.json({ url: data.signedUrl })
}

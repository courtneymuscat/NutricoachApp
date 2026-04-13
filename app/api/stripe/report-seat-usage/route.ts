import { requireCoach } from '@/lib/coach'
import { reportSeatUsage } from '@/lib/billing'

/**
 * POST /api/stripe/report-seat-usage
 * Increments the coach's seat count and fires a Stripe meter event if they
 * have exceeded their plan's included seats. Called after a client is added.
 */
export async function POST() {
  const coachId = await requireCoach()
  if (!coachId) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  await reportSeatUsage(coachId)
  return Response.json({ ok: true })
}

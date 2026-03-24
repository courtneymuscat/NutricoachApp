import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const exerciseId = req.nextUrl.searchParams.get('exerciseId')
  if (!exerciseId) return Response.json([])

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json([])

  // Get user's recent workouts that included this exercise
  const { data: userWorkouts } = await supabase
    .from('workouts')
    .select('id, name, started_at')
    .eq('user_id', session.user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(30)

  if (!userWorkouts?.length) return Response.json([])

  const workoutIds = userWorkouts.map((w) => w.id)

  // Find workout_exercises for this exercise in user's workouts
  const { data: weRows } = await supabase
    .from('workout_exercises')
    .select('id, workout_id')
    .eq('exercise_id', exerciseId)
    .in('workout_id', workoutIds)

  if (!weRows?.length) return Response.json([])

  const weIds = weRows.map((r) => r.id)

  // Load exercise notes separately — resilient to column not existing
  const notesMap: Record<string, string | null> = {}
  try {
    const { data: notesRows } = await supabase
      .from('workout_exercises')
      .select('id, notes')
      .in('id', weIds)
    if (notesRows) {
      for (const r of notesRows) {
        notesMap[r.id] = (r as Record<string, unknown>).notes as string | null ?? null
      }
    }
  } catch { /* notes column missing — skip */ }

  // Fetch all sets regardless of completed status
  const { data: sets } = await supabase
    .from('exercise_sets')
    .select('workout_exercise_id, set_number, weight_lbs, reps, duration_seconds, calories')
    .in('workout_exercise_id', weIds)
    .order('set_number')

  // Build history: one entry per workout, most recent first, max 5
  const workoutMap = Object.fromEntries(userWorkouts.map((w) => [w.id, w]))
  const history = weRows
    .map((we) => {
      const workout = workoutMap[we.workout_id]
      return {
        workoutName: workout?.name ?? 'Workout',
        date: workout?.started_at ?? '',
        notes: notesMap[we.id] ?? null,
        sets: (sets ?? [])
          .filter((s) => s.workout_exercise_id === we.id)
          .map(({ set_number, weight_lbs, reps, duration_seconds, calories }) => ({
            set_number, weight_lbs, reps, duration_seconds, calories,
          })),
      }
    })
    .filter((h) => h.sets.length > 0)
    .slice(0, 5)

  return Response.json(history)
}

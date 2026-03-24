import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return Response.json([])

  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', session.user.id)
    .order('started_at', { ascending: false })
    .limit(10)

  if (!recentWorkouts?.length) return Response.json([])

  const workoutIds = recentWorkouts.map((w) => w.id)

  const { data } = await supabase
    .from('workout_exercises')
    .select('exercise_id, exercises(id, name, category, equipment, muscles, video_url)')
    .in('workout_id', workoutIds)

  if (!data) return Response.json([])

  const seen = new Set<string>()
  const recent = []
  for (const we of data) {
    if (!we.exercises || seen.has(we.exercise_id)) continue
    seen.add(we.exercise_id)
    recent.push(we.exercises)
    if (recent.length >= 8) break
  }

  return Response.json(recent)
}

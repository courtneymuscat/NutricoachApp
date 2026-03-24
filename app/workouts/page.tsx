import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import WorkoutDashboard from './WorkoutDashboard'

export default async function WorkoutsPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">NutriCoach</h1>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-600 hover:underline">
            Dashboard
          </a>
          <span className="text-sm text-gray-600">{session.user.email}</span>
          <form action={logout}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Log out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <WorkoutDashboard />
      </main>
    </div>
  )
}

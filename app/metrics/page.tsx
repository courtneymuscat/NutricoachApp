import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import MetricsClient from './MetricsClient'

export const dynamic = 'force-dynamic'

export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3.5 flex justify-between items-center sticky top-0 z-20">
        <a href="/dashboard" className="text-[15px] font-bold tracking-tight text-gray-900">Prokol</a>
        <div className="flex items-center gap-1">
          <a href="/dashboard" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Dashboard</a>
          <a href="/settings" className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Settings</a>
          <form action={logout}>
            <button type="submit" className="text-[13px] font-medium text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              Log out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track body fat, measurements, and any other metric beyond weight.
          </p>
        </div>
        <MetricsClient />
      </main>
    </div>
  )
}

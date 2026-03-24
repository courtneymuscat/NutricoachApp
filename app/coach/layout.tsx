import { createClient } from '@/lib/supabase/server'
import CoachSidebar from './CoachSidebar'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  let unread = 0
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { count } = await supabase
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', session.user.id)
        .eq('viewed_by_coach', false)
      unread = count ?? 0
    }
  } catch {
    // silently fall back to 0
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CoachSidebar unreadCount={unread} />
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}

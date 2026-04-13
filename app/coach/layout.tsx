import { createClient } from '@/lib/supabase/server'
import CoachSidebar from './CoachSidebar'
import { Suspense } from 'react'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  let unread = 0
  let unreadMessages = 0
  let isBusinessTier = false

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const [formsResult, convosResult, profileResult] = await Promise.all([
        supabase
          .from('form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('coach_id', session.user.id)
          .eq('viewed_by_coach', false),
        supabase
          .from('conversations')
          .select('id')
          .eq('coach_id', session.user.id),
        supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single(),
      ])

      unread = formsResult.count ?? 0
      isBusinessTier = profileResult.data?.subscription_tier === 'coach_business'

      const convoIds = (convosResult.data ?? []).map((c) => c.id)
      if (convoIds.length) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convoIds)
          .neq('sender_id', session.user.id)
          .is('read_at', null)
        unreadMessages = count ?? 0
      }
    }
  } catch {
    // silently fall back to 0
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Suspense required because CoachSidebar uses useSearchParams */}
      <Suspense fallback={<aside className="hidden md:block w-56 shrink-0" />}>
        <CoachSidebar
          unreadCount={unread}
          unreadMessages={unreadMessages}
          isBusinessTier={isBusinessTier}
        />
      </Suspense>
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}

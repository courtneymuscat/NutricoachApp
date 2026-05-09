import type { Metadata } from 'next'
import LandingPage from './LandingPage'
import { createClient } from '@/lib/supabase/server'
import { getOrgForUser } from '@/lib/org'

export const metadata: Metadata = {
  title: 'Prokol Health — Nutrition, Training & Health Data Coaching Platform',
  description:
    'The all-in-one coaching platform for nutritionists, personal trainers, and dietitians. Meal plans, training programs, autoflows, cycle tracking, and white-label for gyms. From $39/month.',
  openGraph: {
    title: 'Prokol Health — Coaching Platform for Coaches & Practitioners',
    description:
      'Meal plans, training, autoflows, cycle tracking, and white-label for gyms. One platform. No add-ons. From $39/month.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prokol Health — Coaching Platform',
    description: 'Everything your coaching practice needs. From $39/month.',
    images: ['/og-image.png'],
  },
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const membership = session ? await getOrgForUser(session.user.id) : null
  const orgManaged = membership && membership.role !== 'owner'
    ? { orgName: membership.org_name }
    : null

  return <LandingPage orgManaged={orgManaged} />
}

import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import GuidesPage from './GuidesPage'

export const metadata: Metadata = {
  title: 'Help & Guides — Prokol Health',
  description:
    'Step-by-step guides for coaches and clients on using Prokol. Covering onboarding, training programs, meal plans, autoflows, food logging, and more.',
}

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

export default function Page() {
  return (
    <div className={dmSans.variable}>
      <GuidesPage />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

type OverageItem = {
  label: string
  amount: number
}

type BillingInfo = {
  subscription_tier: string
  next_billing_date: string | null
  has_stripe_customer: boolean
  seat_count?: number
  included_seats?: number
  coach_seat_count?: number
  included_coaches?: number
  client_overage_rate?: number
  coach_overage_rate?: number
  overage_items?: OverageItem[]
}

const PLAN_DISPLAY: Record<string, { name: string; price: string; isCoach?: boolean }> = {
  individual_free:           { name: 'Tracker',                price: 'Free' },
  individual_optimiser:      { name: 'Optimiser',              price: '$19.99 AUD/mo' },
  individual_elite:          { name: 'Elite',                  price: '$34.99 AUD/mo' },
  coached:                   { name: 'Coached',                price: '' },
  coach_solo:                { name: 'Coach Solo (Legacy)',     price: '$39 AUD/mo',  isCoach: true },
  coach_pt_solo:             { name: 'Solo — Personal Trainer', price: '$39 AUD/mo', isCoach: true },
  coach_nutritionist_solo:   { name: 'Solo — Nutritionist',    price: '$39 AUD/mo',  isCoach: true },
  coach_pro:                 { name: 'Coach Pro',              price: '$89 AUD/mo',  isCoach: true },
  coach_business:            { name: 'Coach Business',         price: '$199 AUD/mo', isCoach: true },
  wl_starter:                { name: 'Web White-label',        price: '$299 AUD/mo', isCoach: true },
  wl_pro:                    { name: 'App Store White-label',  price: '$499 AUD/mo', isCoach: true },
}

const COACH_TIERS = new Set(['coach_solo', 'coach_pt_solo', 'coach_nutritionist_solo', 'coach_pro', 'coach_business', 'wl_starter', 'wl_pro'])

function SeatBar({ used, included, label }: { used: number; included: number; label: string }) {
  const pct = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0
  const isOver = used > included
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className={isOver ? 'text-amber-600 font-medium' : ''}>
          {used} / {included} included
          {isOver && ` (+${used - included} billed)`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function BillingSection({ returnPath = '/settings' }: { returnPath?: string }) {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCancelWarning, setShowCancelWarning] = useState(false)

  useEffect(() => {
    fetch('/api/billing/info')
      .then((r) => r.json())
      .then((d) => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleManage() {
    setRedirecting(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      // Handle known error codes gracefully
      if (data.error === 'billing_mode_mismatch' || data.error === 'billing_customer_not_found') {
        setError(data.message)
      } else {
        setError(data.error ?? data.message ?? 'Something went wrong')
      }
      setRedirecting(false)
    } catch {
      setError('Something went wrong')
      setRedirecting(false)
    }
  }

  function handleManageClick() {
    const tier = info?.subscription_tier ?? 'individual_free'
    if (COACH_TIERS.has(tier)) {
      setShowCancelWarning(true)
    } else {
      handleManage()
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-5">
        <p className="text-sm font-semibold text-gray-900 mb-2">Billing & subscription</p>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  const tier = info?.subscription_tier ?? 'individual_free'
  const plan = PLAN_DISPLAY[tier] ?? { name: tier, price: '' }
  const isCoachTier = COACH_TIERS.has(tier)
  const nextDate = info?.next_billing_date
    ? new Date(info.next_billing_date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const hasOverages = (info?.overage_items?.length ?? 0) > 0
  const overageTotal = (info?.overage_items ?? []).reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Billing & subscription</p>

        {/* Plan header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{plan.name}</p>
            {plan.price && <p className="text-xs text-gray-400 mt-0.5">{plan.price}</p>}
          </div>
          <span className="flex-shrink-0 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            Current plan
          </span>
        </div>

        {/* Seat usage bars for coach plans */}
        {isCoachTier && (info?.included_seats ?? 0) > 0 && (
          <div className="space-y-2 pt-1">
            <SeatBar
              used={info?.seat_count ?? 0}
              included={info?.included_seats ?? 0}
              label="Clients"
            />
            {(info?.included_coaches ?? 0) > 0 && (
              <SeatBar
                used={info?.coach_seat_count ?? 0}
                included={info?.included_coaches ?? 0}
                label="Coaches"
              />
            )}
          </div>
        )}

        {/* Billing breakdown */}
        {(nextDate || hasOverages) && (
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">This month&apos;s bill</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{plan.name} base</span>
                <span>{plan.price}</span>
              </div>
              {(info?.overage_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-amber-600">
                  <span>{item.label}</span>
                  <span>+${item.amount.toFixed(2)}</span>
                </div>
              ))}
              {hasOverages && (
                <div className="flex justify-between text-xs font-semibold text-gray-800 border-t pt-1 mt-1">
                  <span>Estimated total</span>
                  <span>
                    {/* Base price text → number */}
                    ${(parseFloat(plan.price.replace(/[^0-9.]/g, '') || '0') + overageTotal).toFixed(2)} AUD
                  </span>
                </div>
              )}
            </div>
            {nextDate && (
              <p className="text-xs text-gray-400">Next billing date: {nextDate}</p>
            )}
          </div>
        )}

        {/* Overage notice */}
        {isCoachTier && (info?.client_overage_rate ?? 0) > 0 && (
          <p className="text-xs text-gray-400">
            Extra clients billed at ${info?.client_overage_rate}/mo each.
            {(info?.coach_overage_rate ?? 0) > 0 && ` Extra coaches at $${info?.coach_overage_rate}/mo each.`}
          </p>
        )}

        {tier === 'coached' ? (
          <p className="text-xs text-gray-500 italic">Your subscription is managed by your coach.</p>
        ) : tier === 'individual_free' ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">You are on the free Tracker plan.</p>
            <a
              href="/pricing"
              className="inline-block text-xs font-semibold px-4 py-2 rounded-xl text-gray-900"
              style={{ backgroundColor: '#FFD885' }}
            >
              Upgrade plan →
            </a>
          </div>
        ) : info?.has_stripe_customer ? (
          <div className="space-y-2">
            {error && (
              <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3 space-y-1">
                <p>{error}</p>
                {(error.includes('test mode') || error.includes('could not be found')) && (
                  <a href="/pricing" className="underline font-medium">Go to pricing to resubscribe →</a>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleManageClick}
                disabled={redirecting}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                {redirecting ? 'Redirecting…' : 'Manage subscription'}
              </button>
              <a
                href="/pricing"
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors"
              >
                Change plan
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">No active billing account found.</p>
            <a
              href="/pricing"
              className="inline-block text-xs font-semibold px-4 py-2 rounded-xl text-gray-900"
              style={{ backgroundColor: '#FFD885' }}
            >
              Subscribe →
            </a>
          </div>
        )}
      </div>

      {/* Coach cancellation warning modal */}
      {showCancelWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-gray-900">Before you manage your subscription</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                If you <strong>cancel or downgrade</strong> your coaching plan:
              </p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  Your clients on the <strong>Coached plan</strong> will be moved to the free <strong>Tracker plan</strong>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  All client data (food logs, check-ins, weight, workouts) is saved and will be available again if they or you resubscribe.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Clients on their own paid plan are not affected.
                </li>
              </ul>
              <p className="text-xs text-gray-400">
                You can reactivate at any time from the pricing page.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCancelWarning(false); handleManage() }}
                disabled={redirecting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:border-gray-500 transition-colors disabled:opacity-50"
              >
                {redirecting ? 'Redirecting…' : 'Continue to manage subscription'}
              </button>
              <button
                onClick={() => setShowCancelWarning(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900"
                style={{ backgroundColor: '#FFD885' }}
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

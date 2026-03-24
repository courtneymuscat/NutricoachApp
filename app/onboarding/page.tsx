'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type Goal = 'fat_loss' | 'muscle_gain' | 'performance' | 'general_health'
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete'
type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free'

type FormData = {
  goal: Goal | null
  first_name: string
  activity_level: ActivityLevel | ''
  dietary_preference: DietaryPreference | ''
}

// ── Data ──────────────────────────────────────────────────────────────────────

const GOALS: { value: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'fat_loss',
    label: 'Fat Loss',
    description: 'Reduce body fat while preserving muscle',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    value: 'muscle_gain',
    label: 'Muscle Gain',
    description: 'Build strength and add lean mass',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    value: 'performance',
    label: 'Performance',
    description: 'Optimise training output and recovery',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: 'general_health',
    label: 'General Health',
    description: 'Feel better, move more, stress less',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly active', description: '1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', description: '3–5 days/week' },
  { value: 'very_active', label: 'Very active', description: '6–7 days/week' },
  { value: 'athlete', label: 'Athlete', description: 'Training twice a day or competing' },
]

const DIETARY_PREFS: { value: DietaryPreference; label: string }[] = [
  { value: 'none', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
]

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    goal: null,
    first_name: '',
    activity_level: '',
    dietary_preference: '',
  })

  async function handleComplete() {
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: form.goal,
        first_name: form.first_name,
        activity_level: form.activity_level || null,
        dietary_preference: form.dietary_preference || null,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }
    setStep(3)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">NutriCoach</span>
        {step < 3 && (
          <span className="text-xs text-gray-400">Setting up your account</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-8">

          {/* Progress — only show on steps 1 & 2 */}
          {step < 3 && <ProgressBar step={step} total={TOTAL_STEPS - 1} />}

          {/* ── Step 1: Goal ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">What's your main goal?</h1>
                <p className="text-gray-500 text-sm mt-1">This helps us personalise your experience.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setForm((f) => ({ ...f, goal: g.value }))}
                    className={`text-left p-5 rounded-2xl border-2 transition-all ${
                      form.goal === g.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`mb-3 ${form.goal === g.value ? 'text-blue-600' : 'text-gray-400'}`}>
                      {g.icon}
                    </div>
                    <p className={`text-sm font-bold ${form.goal === g.value ? 'text-blue-700' : 'text-gray-900'}`}>
                      {g.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.goal}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2: Profile info ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tell us a bit about yourself</h1>
                <p className="text-gray-500 text-sm mt-1">All fields are optional — you can update these later.</p>
              </div>

              <div className="bg-white rounded-2xl border p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="e.g. Alex"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Activity level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity level</label>
                  <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((a) => (
                      <label
                        key={a.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          form.activity_level === a.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          form.activity_level === a.value ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                        }`}>
                          {form.activity_level === a.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <input
                          type="radio"
                          name="activity_level"
                          value={a.value}
                          checked={form.activity_level === a.value}
                          onChange={() => setForm((f) => ({ ...f, activity_level: a.value }))}
                          className="sr-only"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.label}</p>
                          <p className="text-xs text-gray-500">{a.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dietary preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dietary preference</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_PREFS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, dietary_preference: d.value }))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          form.dietary_preference === d.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : 'Complete setup'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {form.first_name ? `Welcome, ${form.first_name}!` : "You're all set!"}
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  Your account is ready. Head to your dashboard to start tracking.
                </p>
              </div>

              <div className="bg-white rounded-2xl border p-5 text-left space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your goal</p>
                <p className="text-sm font-semibold text-gray-900">
                  {GOALS.find((g) => g.value === form.goal)?.label}
                </p>
                <p className="text-xs text-gray-500">
                  {GOALS.find((g) => g.value === form.goal)?.description}
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

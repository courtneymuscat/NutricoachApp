import Link from 'next/link'
import PricingCards from './pricing/PricingCards'

const FEATURES = [
  {
    emoji: '🍽️',
    title: 'Smart Nutrition Tracking',
    desc: 'Log meals in seconds — manually, by barcode, or by snapping a photo. Built-in macro tracking keeps you on top of your goals every day.',
    bullets: [
      'Manual food entry with full macros',
      'Barcode scanner for packaged foods',
      'AI meal photo scanning (Elite)',
      'Meal builder + saved meal templates',
    ],
  },
  {
    emoji: '💪',
    title: 'Training & Recovery',
    desc: 'Track workouts, monitor your weight over time, and log recovery data that actually matters — sleep, HRV, RHR, and energy.',
    bullets: [
      'Structured workout logging + sections',
      'Weight trend chart + full history',
      'Daily check-in: sleep, HRV, RHR, energy',
      'Exercise library with video guides',
    ],
  },
  {
    emoji: '🌸',
    title: 'Cycle Intelligence',
    desc: 'The most comprehensive cycle tracker built into a nutrition app. Track, understand, and predict your cycle — then train around it.',
    bullets: [
      'Period dates + cycle phase awareness',
      'Symptoms, BBT, cervical mucus, moods',
      'Predict period, ovulation & phase windows',
      'Personalised insights from your data (Elite)',
    ],
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your free account', desc: 'Sign up in under 30 seconds. No credit card required to get started.' },
  { step: '02', title: 'Choose your plan', desc: 'Start free, or unlock the full experience with Optimiser or Elite.' },
  { step: '03', title: 'Start tracking', desc: 'Log your food, workouts, weight and cycle — all in one place.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">NutriCoach</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#coaches" className="hover:text-gray-900 transition-colors">For Coaches</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 rounded-xl text-gray-900 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#FFD885' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF5D0 50%, #FFFBF0 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-full border border-yellow-200 bg-white text-yellow-700">
            ✨ Now with AI meal scanning
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Train smarter.<br />
            Recover better.<br />
            <span style={{ color: '#B08000' }}>Understand your body.</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            NutriCoach tracks your nutrition, training, weight, and cycle in one place — so you can perform at your best, every single day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="text-base font-semibold px-8 py-4 rounded-2xl text-gray-900 transition-colors hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#FFD885' }}
            >
              Start for free →
            </Link>
            <a
              href="#pricing"
              className="text-base font-semibold px-8 py-4 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View plans
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
            {['📷 AI Meal Scanner', '⚡ Food Logging', '💪 Workouts', '🌸 Cycle Intelligence', '❤️ Recovery Tracking'].map((f) => (
              <span key={f} className="bg-white rounded-full px-3 py-1 border border-gray-100 shadow-sm">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need, nothing you don&apos;t</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Three pillars of health tracking, built to work together.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="space-y-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: '#FFF5D0' }}>
                  {f.emoji}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">{f.desc}</p>
                </div>
                <ul className="space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#FFD885" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Get started in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="space-y-3">
                <span className="text-4xl font-bold" style={{ color: '#FFD885' }}>{s.step}</span>
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
          </div>
          <PricingCards currentTier={null} currentUserType={null} />
        </div>
      </section>

      {/* ── Coaches ─────────────────────────────────────────────────────────── */}
      <section id="coaches" className="py-24 px-6" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <div className="inline-block text-sm font-medium px-4 py-1.5 rounded-full border border-yellow-200 bg-white text-yellow-700">
              For health &amp; fitness coaches
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Your clients. Their data. Your insights.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Manage clients, review check-ins, send forms, and watch your clients thrive — all from one dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { icon: '👥', label: 'Client management', desc: 'Invite clients and manage your roster' },
              { icon: '📋', label: 'Custom forms', desc: 'Send onboarding and check-in forms' },
              { icon: '💬', label: 'Direct messaging', desc: 'Message clients inside the app' },
              { icon: '📊', label: 'Client data', desc: 'View food logs, workouts, weight & check-ins' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/signup?type=coach"
            className="inline-block text-sm font-semibold px-8 py-4 rounded-2xl text-gray-900 hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#FFD885' }}
          >
            Start coaching →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Ready to understand your body?</h2>
          <p className="text-gray-400 text-lg">Join NutriCoach free today — no credit card required.</p>
          <Link
            href="/signup"
            className="inline-block text-base font-semibold px-10 py-4 rounded-2xl text-gray-900 hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#FFD885' }}
          >
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-bold text-white">NutriCoach</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-300 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-gray-300 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-gray-300 transition-colors">Sign up</Link>
          </div>
          <span>© {new Date().getFullYear()} NutriCoach. All rights reserved.</span>
        </div>
      </footer>

    </div>
  )
}

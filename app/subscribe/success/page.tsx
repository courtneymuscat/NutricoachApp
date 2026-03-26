import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#FFF5D0' }}>
          <svg className="w-8 h-8" fill="none" stroke="#FFD885" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your subscription is now active. Welcome to NutriCoach — let&apos;s get you started.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-center text-gray-900 transition-colors"
            style={{ backgroundColor: '#FFD885' }}
          >
            Go to dashboard →
          </Link>
          <Link
            href="/onboarding"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Complete onboarding first
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Prokol Health',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          ← Prokol Health
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Effective date: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of terms</h2>
            <p>
              These Terms of Service ("Terms") are a legally binding agreement between you and Prokol Health
              (ABN 33 972 014 877), trading as Prokol ("Prokol Health", "we", "us", "our"). By creating an
              account, accessing, or using the Prokol platform ("Service"), you agree to be bound by these
              Terms and our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
            <p className="mt-3">
              If you do not agree to these Terms, do not use the Service. If you are accepting these Terms on
              behalf of an organisation, you represent that you have authority to bind that organisation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description of service</h2>
            <p>
              Prokol is a digital health and nutrition coaching platform that provides tools for food logging,
              macro and calorie tracking, workout logging, cycle tracking, progress monitoring, and coach-client
              communication. The Service is provided via web browser and progressive web application.
            </p>
            <p className="mt-3">
              <strong>Not medical advice.</strong> The Service and all content within it (including nutritional
              targets, meal plans, and coaching recommendations) are for informational and educational purposes
              only. Nothing in the Service constitutes medical advice, diagnosis, or treatment. Always consult a
              qualified health professional before making changes to your diet, exercise programme, or health
              management. Prokol Health is not responsible for any health outcomes arising from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Account registration</h2>
            <p>To use the Service you must:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Be at least 16 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Notify us immediately of any unauthorised use of your account</li>
            </ul>
            <p className="mt-3">
              You are responsible for all activity that occurs under your account. We reserve the right to
              terminate accounts that violate these Terms or that we reasonably believe have been compromised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Subscriptions and billing</h2>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.1 Free tier</h3>
            <p>
              A free account is available with limited features. No payment information is required for a free
              account.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.2 Paid subscriptions</h3>
            <p>
              Paid subscription plans are billed in Australian Dollars (AUD) on a monthly or annual basis via
              Stripe. Prices are displayed on our pricing page and may be subject to applicable taxes. By
              subscribing you authorise us to charge your payment method on a recurring basis until cancellation.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.3 Free trials</h3>
            <p>
              Where offered, free trials convert automatically to a paid subscription at the end of the trial
              period. You may cancel before the trial ends to avoid being charged.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time from Settings → Subscription. Cancellation takes
              effect at the end of the current billing period. We do not provide refunds for partial periods
              except where required by Australian Consumer Law.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.5 Price changes</h3>
            <p>
              We may change subscription prices with at least 30 days written notice via email. Continued use
              after the effective date constitutes acceptance of the new price.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Coaches and clients</h2>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">5.1 Coach responsibilities</h3>
            <p>
              Coaches using the platform to manage clients are solely responsible for the advice, meal plans,
              and recommendations they provide to clients. Coaches must hold any qualifications required by
              applicable law for the services they provide. Prokol Health is a technology platform and is not
              responsible for the quality or appropriateness of coaching services delivered through the Service.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">5.2 Client consent</h3>
            <p>
              Coaches are responsible for obtaining appropriate consent from clients before collecting or
              processing their health information through the Service, in accordance with applicable privacy law.
            </p>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">5.3 White-label deployments</h3>
            <p>
              Organisations operating white-label deployments remain subject to these Terms. The organisation
              is responsible for ensuring their coaches and clients comply with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Service in any unlawful manner or for any unlawful purpose</li>
              <li>Upload false, misleading, or harmful health information</li>
              <li>Attempt to gain unauthorised access to any part of the Service or another user's account</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use automated tools to scrape, crawl, or index the Service without our written consent</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Introduce viruses or malicious code</li>
              <li>Resell or sublicense access to the Service without written authorisation from Prokol Health</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these rules without notice or
              refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Intellectual property</h2>
            <p>
              The Service, including its design, software, algorithms, and content created by Prokol Health,
              is owned by Prokol Health and protected by Australian and international intellectual property
              laws. You are granted a limited, non-exclusive, non-transferable licence to use the Service for
              its intended purpose.
            </p>
            <p className="mt-3">
              You retain ownership of the personal data and content you submit to the Service. By submitting
              content you grant us a limited licence to use, store, and process it solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Termination</h2>
            <p>
              Either party may terminate the agreement at any time. You may delete your account from Settings.
              We may suspend or terminate your account immediately if you breach these Terms, fail to pay
              subscription fees, or if we are required to do so by law.
            </p>
            <p className="mt-3">
              Upon termination, your right to use the Service ceases. We will handle your data in accordance
              with our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Disclaimers and limitation of liability</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, express or
              implied, including fitness for a particular purpose or uninterrupted availability.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by law, Prokol Health's total liability to you for any claim
              arising from your use of the Service is limited to the amount you paid us in the 12 months
              preceding the claim. We are not liable for indirect, incidental, special, consequential, or
              punitive damages.
            </p>
            <p className="mt-3">
              Nothing in these Terms excludes or limits liability that cannot be excluded under the Australian
              Consumer Law, including guarantees as to acceptable quality and fitness for purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing law</h2>
            <p>
              These Terms are governed by the laws of New South Wales, Australia. You and Prokol Health submit
              to the exclusive jurisdiction of the courts of New South Wales and the Federal Court of Australia
              for any dispute arising under these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email or
              prominent notice within the Service at least 14 days before the change takes effect. Continued
              use of the Service after the effective date constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Contact us</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-1">
              <p className="font-semibold text-gray-900">Prokol Health</p>
              <p>ABN 33 972 014 877</p>
              <p>502 Castlereagh Rd, Agnes Banks NSW 2753, Australia</p>
              <p>
                Email:{' '}
                <a href="mailto:courtney@prokol.io" className="text-blue-600 hover:underline">
                  courtney@prokol.io
                </a>
              </p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Prokol Health (ABN 33 972 014 877) trading as Prokol</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

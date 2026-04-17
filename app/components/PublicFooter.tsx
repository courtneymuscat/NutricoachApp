import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 px-6 py-6 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} Prokol Health (ABN 33 972 014 877) trading as Prokol</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" target="_blank" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" target="_blank" className="hover:text-gray-600 transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}

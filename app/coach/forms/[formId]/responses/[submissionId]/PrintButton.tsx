'use client'

import { useEffect } from 'react'

// Triggers the browser's native print dialog. The user picks "Save as PDF"
// from there. Auto-print on mount when the URL has ?print=1 so other
// places in the app can deep-link straight into the save-as-PDF flow.
export default function PrintButton() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('print') !== '1') return
    // Wait for fonts + layout to settle so the PDF render isn't blank.
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors print:hidden"
      title="Save as PDF"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF
    </button>
  )
}

'use client'

import { useState } from 'react'

export default function OrgFormCopyButton({ formId }: { formId: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      onClick={async () => {
        setBusy(true)
        const res = await fetch('/api/coach/templates/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'forms', source_id: formId }),
        })
        if (res.ok) {
          const { id } = await res.json()
          window.location.href = `/coach/forms/${id}/edit`
        } else {
          setBusy(false)
        }
      }}
      disabled={busy}
      className="text-xs font-medium text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
    >
      {busy ? 'Copying…' : 'Make a copy'}
    </button>
  )
}

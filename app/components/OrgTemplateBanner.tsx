import type { OrgTemplateContext } from '@/lib/org'

/**
 * Banner shown to an org owner/admin when they're editing the org-shared
 * version of a template. Makes it explicit that saving will affect all
 * coaches in the org and (optionally) active client flows.
 */
export function OrgPublisherBanner({
  ctx,
  pushClientsLabel,
}: {
  ctx: OrgTemplateContext
  pushClientsLabel?: string
}) {
  if (!ctx.publishingToOrg) return null
  const orgName = ctx.orgName ?? 'your organisation'
  const others = ctx.sharedCoachCount
  const coachLine =
    others === 0
      ? `Saving will update the org-shared version for ${orgName}.`
      : `Saving will update the version ${others} other ${others === 1 ? 'coach' : 'coaches'} in ${orgName} ${others === 1 ? 'sees' : 'see'}.`
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
      <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-2.99l-7.07-12.27a2 2 0 00-3.48 0L3.19 16.01A2 2 0 004.93 19z" />
      </svg>
      <div className="text-sm text-amber-900">
        <span className="font-semibold">Editing the org-shared version.</span> {coachLine}
        {pushClientsLabel && (
          <> {pushClientsLabel}</>
        )}
      </div>
    </div>
  )
}

/**
 * Small subtitle shown on personal copies that originated from an org
 * template. Makes it obvious that the copy is detached and won't track
 * upstream changes.
 */
export function CopiedFromOrgSubtitle({ ctx }: { ctx: OrgTemplateContext }) {
  if (!ctx.copiedFromOrgTemplate) return null
  const { name, orgName } = ctx.copiedFromOrgTemplate
  return (
    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Copied from {orgName ? `${orgName} template` : 'org template'} <span className="font-medium text-gray-500">&ldquo;{name}&rdquo;</span>
      <span className="text-gray-300">· detached, won&apos;t track upstream changes</span>
    </p>
  )
}

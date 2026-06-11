import { useAnalysisStore } from '../../../store/useAnalysisStore'
import type { Severity } from '../../../schema'
import { scrollToPath } from '../scrollToPath'

const SEV_RANK: Record<Severity, number> = { high: 0, warn: 1, info: 2 }
const SEV_BORDER: Record<Severity, string> = {
  high: 'border-l-status-high',
  warn: 'border-l-status-warn',
  info: 'border-l-status-info',
}
const SEV_TEXT: Record<Severity, string> = {
  high: 'text-status-high',
  warn: 'text-status-warn',
  info: 'text-status-info',
}

export default function ConfidenceFlagsSection() {
  const flags = useAnalysisStore((s) => s.analysis?.confidenceFlags)
  const setFlagDismissed = useAnalysisStore((s) => s.setFlagDismissed)
  const clearAllFilters = useAnalysisStore((s) => s.clearAllFilters)
  if (!flags) return null

  const indexed = flags.map((flag, index) => ({ flag, index }))
  const active = indexed
    .filter((x) => !x.flag.dismissed)
    .sort((a, b) => SEV_RANK[a.flag.severity] - SEV_RANK[b.flag.severity])
  const resolved = indexed.filter((x) => x.flag.dismissed)

  // The target may be filtered out of the grid — clear filters and retry once.
  const show = (path: string) => {
    if (!scrollToPath(path)) {
      clearAllFilters()
      window.setTimeout(() => scrollToPath(path), 150)
    }
  }

  if (indexed.length === 0) {
    return <p className="font-sans text-xs text-charcoal-muted">No flags — clean analysis.</p>
  }

  return (
    <div className="space-y-2">
      {active.length === 0 && (
        <p className="font-sans text-xs text-status-good">All flags resolved.</p>
      )}
      {active.map(({ flag, index }) => (
        <div
          key={index}
          className={`rounded-md border border-l-2 border-cream-300 bg-surface p-3 ${SEV_BORDER[flag.severity]}`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className={`font-mono text-[10px] uppercase tracking-wider ${SEV_TEXT[flag.severity]}`}>
              {flag.severity}
            </span>
            <span className="min-w-0 truncate font-mono text-[10px] text-charcoal-faint" title={flag.path}>
              {flag.path}
            </span>
          </div>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-charcoal">{flag.message}</p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => show(flag.path)}
              className="font-sans text-xs font-medium text-charcoal underline-offset-2 hover:underline"
            >
              Show in preview
            </button>
            <button
              type="button"
              onClick={() => setFlagDismissed(index, true)}
              className="font-sans text-xs text-charcoal-muted underline-offset-2 hover:underline"
            >
              Resolve
            </button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <div className="pt-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
            Resolved ({resolved.length})
          </p>
          <div className="mt-1.5 space-y-1.5">
            {resolved.map(({ flag, index }) => (
              <div key={index} className="flex items-start justify-between gap-3 rounded-md bg-cream-200/60 px-3 py-2">
                <p className="min-w-0 font-sans text-[11px] leading-snug text-charcoal-faint line-through">
                  {flag.message}
                </p>
                <button
                  type="button"
                  onClick={() => setFlagDismissed(index, false)}
                  className="shrink-0 font-sans text-[11px] text-charcoal-muted underline-offset-2 hover:underline"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

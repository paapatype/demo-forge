import { useAnalysisStore } from '../../store/useAnalysisStore'
import { PIPELINE_STAGES } from '../../brain/client'
import { Check } from './icons'

/** Staged loading that mirrors the analysis pipeline order (§7). */
export default function LoadingPipeline() {
  const index = useAnalysisStore((s) => s.loadingIndex)
  const fileName = useAnalysisStore((s) => s.sourceFileName)

  return (
    <div className="grid min-h-full place-items-center px-8 py-20">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream-300 border-t-charcoal" />
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-charcoal-muted">
            Analyzing {fileName ?? 'catalogue'}
          </p>
        </div>

        <ol className="mt-7 space-y-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const done = i < index
            const active = i === index
            return (
              <li
                key={stage.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-300 ${
                  active ? 'bg-surface shadow-sm' : ''
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-cream transition-colors duration-300 ${
                    done ? 'bg-status-good' : active ? 'bg-terracotta' : 'bg-cream-300'
                  }`}
                >
                  {done ? (
                    <Check size={12} />
                  ) : active ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cream" />
                  ) : null}
                </span>
                <span
                  className={`font-sans text-sm ${
                    active ? 'text-charcoal' : done ? 'text-charcoal-muted' : 'text-charcoal-faint'
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

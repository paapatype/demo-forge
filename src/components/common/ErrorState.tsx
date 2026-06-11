import { useAnalysisStore } from '../../store/useAnalysisStore'
import type { AnalyzeErrorKind } from '../../brain/client'
import { Alert } from './icons'

const HINTS: Record<AnalyzeErrorKind, string> = {
  oversized: 'The PDF is larger than the 32 MB limit. Try splitting it or compressing images.',
  scanned: 'This looks like a scanned PDF. OCR is not supported in v0 — re-export it as a digital PDF.',
  malformed: 'The analysis came back off-contract. Re-running usually fixes it.',
  network: 'Could not reach Anthropic. Check your connection and try again.',
  server: 'The analysis hit an error. Try again in a moment.',
  nokey: 'Add your Anthropic API key in Settings (the gear, top-right) to analyze PDFs — or open a demo catalogue.',
}

export default function ErrorState() {
  const error = useAnalysisStore((s) => s.error)
  const reset = useAnalysisStore((s) => s.reset)

  return (
    <div className="grid min-h-full place-items-center px-8 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-status-high/10 text-status-high">
          <Alert size={26} />
        </div>
        <h2 className="mt-5 text-2xl">Analysis didn't complete</h2>
        <p className="mt-2 font-sans text-sm text-charcoal">{error?.message ?? 'Unknown error.'}</p>
        {error && (
          <p className="mt-2 font-sans text-sm text-charcoal-muted">{HINTS[error.kind]}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 bg-charcoal px-5 py-2 font-sans text-sm font-medium tracking-wide text-cream shadow-sm transition-colors duration-150 hover:bg-charcoal-light"
        >
          Start over
        </button>
      </div>
    </div>
  )
}

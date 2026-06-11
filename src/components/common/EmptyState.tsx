import { useAnalysisStore } from '../../store/useAnalysisStore'
import { FIXTURE_LABELS, type FixtureKey } from '../../brain/mock'
import { IS_MOCK } from '../../brain/client'
import { hasApiKey } from '../../settings/apiKey'
import Dropzone from './Dropzone'
import { Sparkle } from './icons'

export default function EmptyState() {
  const runAnalyze = useAnalysisStore((s) => s.runAnalyze)
  const loadFixtureNow = useAnalysisStore((s) => s.loadFixtureNow)
  const needsKey = !hasApiKey() && !IS_MOCK

  return (
    <div className="grid min-h-full place-items-center px-8 py-16">
      <div className="w-full max-w-2xl">
        <p className="flex items-center gap-2 eyebrow">
          <Sparkle size={14} /> Demo Forge
        </p>
        <h1 className="mt-3 text-5xl leading-[1.1] tracking-tight">Turn a PDF catalogue into a live one.</h1>
        <p className="mt-3 max-w-prose font-sans text-base text-charcoal-muted">
          Drop a manufacturer's PDF. Claude classifies the catalogue, extracts its structure, and
          renders it here — branded, filterable, and editable before you ship.
        </p>

        <div className="mt-8">
          <Dropzone onFile={(f) => runAnalyze(f)} />
        </div>

        {needsKey && (
          <p className="mt-3 font-sans text-xs leading-relaxed text-charcoal-muted">
            To analyze your own PDF, add your Anthropic API key in{' '}
            <span className="font-medium text-charcoal">Settings</span> (the gear, top-right) — it
            stays in your browser. The demo catalogues below need no key.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-charcoal-faint">
            {IS_MOCK ? 'Mock mode · ' : ''}Or open demo data
          </span>
          {(Object.keys(FIXTURE_LABELS) as FixtureKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => loadFixtureNow(key)}
              className="ia-btn-quiet"
            >
              {FIXTURE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

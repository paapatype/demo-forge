import { useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { FIXTURE_LABELS, type FixtureKey } from '../../brain/mock'
import { IS_MOCK } from '../../brain/client'
import { hasApiKey } from '../../settings/apiKey'
import { useServerKeyActive } from '../../settings/serverStatus'
import Dropzone from '../common/Dropzone'
import ApproveBuild from '../export/ApproveBuild'
import BuildCatalogue from '../export/BuildModal'
import LibraryDrawer from '../export/LibraryDrawer'
import SettingsModal from './SettingsModal'
import { Gear } from '../common/icons'

export default function TopBar() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const runAnalyze = useAnalysisStore((s) => s.runAnalyze)
  const loadFixtureNow = useAnalysisStore((s) => s.loadFixtureNow)
  const mockFixture = useAnalysisStore((s) => s.mockFixture)
  const reset = useAnalysisStore((s) => s.reset)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const serverKeyActive = useServerKeyActive()

  // The local server holding the key (or a browser key, or mock) all mean "no nag needed".
  // Closing the modal re-renders the bar, refreshing the dot.
  const needsKey = !hasApiKey() && !IS_MOCK && !serverKeyActive

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-4 border-b border-cream-300 bg-cream/90 px-5 backdrop-blur">
      <button type="button" onClick={reset} className="flex items-center gap-2" title="Demo Forge — start over">
        <span className="h-3.5 w-3.5 rounded-[3px] bg-terracotta" />
        <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-charcoal">
          IndexArch
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-charcoal-faint">
          Demo&nbsp;Forge
        </span>
      </button>

      {analysis && (
        <>
          <span className="h-5 w-px bg-cream-300" />
          <span className="min-w-0 truncate font-serif text-lg text-charcoal">
            {analysis.meta.client}
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-2.5">
        <label className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-[11px] uppercase tracking-wider text-charcoal-faint">
            Demo
          </span>
          <select
            value={mockFixture}
            onChange={(e) => loadFixtureNow(e.target.value as FixtureKey)}
            className="rounded-sm border border-cream-300 bg-surface px-3 py-1.5 font-sans text-sm text-charcoal"
          >
            {(Object.keys(FIXTURE_LABELS) as FixtureKey[]).map((k) => (
              <option key={k} value={k}>
                {FIXTURE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        {serverKeyActive && (
          <span
            className="hidden items-center gap-1.5 rounded-sm border border-cream-300 bg-surface px-2.5 py-1 md:inline-flex"
            title="Running locally — the server holds your API key from .env. No browser key needed."
          >
            <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-muted">
              Local key
            </span>
          </span>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title="Settings — Anthropic API key"
          className="relative grid h-8 w-8 place-items-center rounded-sm border border-cream-300 bg-surface text-charcoal transition-colors hover:bg-cream-200"
        >
          <Gear size={16} />
          {needsKey && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-terracotta" title="Add your API key" />
          )}
        </button>

        <LibraryDrawer />
        {analysis && <Dropzone compact onFile={(f) => runAnalyze(f)} />}
        {analysis && <BuildCatalogue />}
        {analysis && <ApproveBuild />}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  )
}

import { useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { buildStandalone, downloadHtml } from '../../build/buildStandalone'
import { subsetAnalysis, suggestDemoFamilies } from '../../build/subset'
import { Check, Close, Cube, Download, Sparkle } from '../common/icons'

type Mode = 'full' | 'demo'
type Phase = 'idle' | 'building' | 'done' | 'error'

/**
 * Build a shareable, self-contained catalogue file (Feature 2 + 3). "Full catalogue" inlines the
 * whole approved analysis; "5-product demo" subsets to a handful of families for a prospect on a
 * call. Both produce one HTML file you host or email. Runs on the deployed app (or `npm run
 * preview`) — the dev server emits dev-only module URLs that won't run anywhere else.
 */
export default function BuildCatalogue() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const families = useAnalysisStore((s) => s.analysis?.core.catalog?.families)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('full')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!analysis) return null
  const familyList = families ?? []
  const hasFamilies = familyList.length > 0
  const isDev = import.meta.env.DEV

  const openModal = () => {
    if (hasFamilies) setSelected(new Set(suggestDemoFamilies(analysis, 5)))
    setMode('full')
    setPhase('idle')
    setError(null)
    setOpen(true)
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const build = async () => {
    setPhase('building')
    setError(null)
    try {
      const target =
        mode === 'demo' && hasFamilies ? subsetAnalysis(analysis, [...selected]) : analysis
      const html = await buildStandalone(target)
      const slug = analysis.meta.slug || 'catalogue'
      downloadHtml(html, `${slug}.${mode === 'demo' ? 'demo' : 'catalogue'}.html`)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Build failed.')
      setPhase('error')
    }
  }

  const canBuild = !isDev && (mode === 'full' || selected.size > 0) && phase !== 'building'

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 ia-btn-outline"
        title="Build a shareable catalogue file"
      >
        <Cube size={15} />
        Build
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-charcoal/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl rounded-bl-sm border border-cream-300 bg-cream shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-cream-300 px-6 py-4">
              <div>
                <p className="eyebrow">Build &amp; share</p>
                <h2 className="font-serif text-xl text-charcoal">Make a catalogue file</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-charcoal hover:bg-cream-200"
              >
                <Close size={18} />
              </button>
            </div>

            {/* mode picker */}
            <div className="grid shrink-0 grid-cols-2 gap-2 px-6 pt-5">
              <ModeTab
                active={mode === 'full'}
                onClick={() => setMode('full')}
                Icon={Cube}
                title="Full catalogue"
                sub={hasFamilies ? `${familyList.length} families` : 'Everything'}
              />
              <ModeTab
                active={mode === 'demo'}
                onClick={() => hasFamilies && setMode('demo')}
                Icon={Sparkle}
                title="5-product demo"
                sub={hasFamilies ? 'Pick a few' : 'Catalogues only'}
                disabled={!hasFamilies}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {mode === 'full' ? (
                <p className="font-sans text-sm leading-relaxed text-charcoal-muted">
                  Bundles the entire approved catalogue into one self-contained{' '}
                  <span className="font-mono text-xs text-charcoal">.html</span> file — filters,
                  detail views, the quote cart, all of it. Host it or email it; nothing else needed.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-sm text-charcoal-muted">
                      Feature a handful for a prospect on a call.
                    </p>
                    <span className="shrink-0 font-mono text-xs text-charcoal-faint">
                      {selected.size} selected
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {familyList.map((f) => {
                      const on = selected.has(f.id)
                      const filters = f.variantAxes.filter((a) => a.isFilter && !a.isIdentifier).length
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggle(f.id)}
                          className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                            on
                              ? 'border-charcoal/30 bg-cream-200/70'
                              : 'border-cream-300 bg-surface hover:bg-cream-200/40'
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${
                              on ? 'border-charcoal bg-charcoal text-cream' : 'border-cream-300'
                            }`}
                          >
                            {on && <Check size={11} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-serif text-sm text-charcoal">
                            {f.name}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-charcoal-faint">
                            {filters} filters · {f.skuCount} SKUs
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="shrink-0 border-t border-cream-300 px-6 py-4">
              {isDev && (
                <p className="mb-3 rounded-md border border-status-warn/40 bg-status-warn/10 px-3 py-2 font-sans text-xs leading-relaxed text-charcoal">
                  Building runs on the deployed app or{' '}
                  <span className="font-mono text-[11px]">npm run preview</span> — the dev server
                  emits dev-only module URLs that won&apos;t open elsewhere.
                </p>
              )}
              {error && (
                <p className="mb-3 rounded-md border border-status-high/40 bg-status-high/10 px-3 py-2 font-sans text-xs leading-relaxed text-charcoal">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={build}
                disabled={!canBuild}
                className={`flex w-full items-center justify-center gap-2 px-5 py-2.5 font-sans text-sm font-medium tracking-wide shadow-sm transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                  phase === 'done' ? 'bg-status-good text-cream' : 'bg-charcoal text-cream hover:bg-charcoal-light'
                }`}
              >
                {phase === 'building' ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
                    Building…
                  </>
                ) : phase === 'done' ? (
                  <>
                    <Check size={15} />
                    Downloaded — host it or email it
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    {mode === 'demo' ? `Build demo (${selected.size})` : 'Build full catalogue'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ModeTab({
  active,
  onClick,
  Icon,
  title,
  sub,
  disabled,
}: {
  active: boolean
  onClick: () => void
  Icon: typeof Cube
  title: string
  sub: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-1 rounded-md border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active ? 'border-charcoal bg-charcoal text-cream' : 'border-cream-300 bg-surface hover:bg-cream-200/50'
      }`}
    >
      <Icon size={16} className={active ? 'text-cream' : 'text-charcoal-faint'} />
      <span className="font-sans text-sm font-medium">{title}</span>
      <span className={`font-mono text-[10px] ${active ? 'text-cream/70' : 'text-charcoal-faint'}`}>
        {sub}
      </span>
    </button>
  )
}

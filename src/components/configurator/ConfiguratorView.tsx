import { useState } from 'react'
import type { Analysis, SpecAxis } from '../../schema'
import { displayUnit, formatRange } from '../../schema'
import { Check, Sparkle } from '../common/icons'
import { useReveal } from '../common/useReveal'

/**
 * v0 configurator stub (§7): a clean READ-ONLY view of the extracted spec-axes, capabilities, and
 * technical library, plus the viability read and a single-spec quote-request stub. Structured so the
 * full guided configurator drops in later against the same core.configurator data.
 */
function AxisValue({ axis }: { axis: SpecAxis }) {
  if (axis.values?.length) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {axis.values.map((v) => (
          <span
            key={v}
            className="rounded-full border border-cream-300 bg-cream px-2.5 py-0.5 font-sans text-xs text-charcoal"
          >
            {v}
          </span>
        ))}
      </div>
    )
  }
  if (axis.range) {
    return (
      <p className="mt-2 font-mono text-sm text-charcoal">
        {formatRange(axis.range.min, axis.range.max, displayUnit(axis.unit, null))}
      </p>
    )
  }
  return <p className="mt-2 font-mono text-sm text-charcoal-faint">free text</p>
}

export default function ConfiguratorView({ analysis }: { analysis: Analysis }) {
  const cfg = analysis.core.configurator
  const [requested, setRequested] = useState(false)
  const ref = useReveal<HTMLDivElement>()
  if (!cfg) return null
  const { meta, about, archetype, viability } = analysis
  const confidence = Math.round(archetype.confidence * 100)

  return (
    <div ref={ref} className="px-8 py-9 pb-24">
      {analysis.brand.logo && (
        <img
          src={analysis.brand.logo}
          alt={`${meta.client} logo`}
          className="mb-4 h-10 w-auto max-w-[200px] object-contain object-left"
        />
      )}
      <p className="eyebrow">
        Configurator · {meta.pageCount} pp · {meta.flavor}
      </p>
      <h1 className="mt-2 text-5xl leading-[1.1] tracking-tight">{meta.client}</h1>
      {about.blurb && (
        <p className="mt-3 max-w-prose font-sans text-base text-charcoal-muted">{about.blurb}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2" data-path="archetype">
        <span className="rounded-full bg-charcoal px-3 py-1 font-mono text-xs text-cream">
          {archetype.buyerAction} · {confidence}% sure
        </span>
        <span className="font-mono text-xs text-status-good">
          configurator fit: {viability.fitForConfigurator}
        </span>
        <span className="font-mono text-xs text-charcoal-faint">
          build complexity: {viability.buildComplexity}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-2 ia-card px-4 py-2.5">
        <Sparkle size={15} className="text-terracotta" />
        <p className="font-sans text-sm text-charcoal-muted">
          Configurator preview — read-only in v0. The full guided configurator drops in here against
          the same spec data.
        </p>
      </div>

      {/* spec axes */}
      <section className="mt-9">
        <h2 className="font-mono text-xs uppercase tracking-widest text-charcoal-faint">
          Specification axes — what the buyer configures
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cfg.specAxes.map((axis, i) => (
            <div
              key={axis.key}
              data-path={`core.configurator.specAxes[${i}]`}
              className="ia-card p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg text-charcoal">{axis.label}</h3>
                <span className="rounded-full bg-cream-200 px-2 py-0.5 font-mono text-[10px] uppercase text-charcoal-muted">
                  {axis.inputKind}
                </span>
              </div>
              <AxisValue axis={axis} />
              {axis.helpText && (
                <p className="mt-3 font-sans text-sm text-charcoal-muted">{axis.helpText}</p>
              )}
              {axis.constraints && (
                <p className="mt-2 font-mono text-xs text-status-warn">⚠ {axis.constraints}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* capabilities */}
      {cfg.capabilities.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-charcoal-faint">
            Capabilities
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {cfg.capabilities.map((c) => (
              <div key={c.title} className="ia-card p-5">
                <h3 className="font-serif text-lg text-charcoal">{c.title}</h3>
                <p className="mt-1.5 font-sans text-sm text-charcoal-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* technical library */}
      {cfg.technicalLibrary.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-charcoal-faint">
            Technical library
          </h2>
          <div className="mt-4 divide-y divide-cream-300 overflow-hidden ia-card">
            {cfg.technicalLibrary.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-charcoal">{t.name}</p>
                  <p className="font-mono text-xs text-charcoal-muted">{t.note}</p>
                </div>
                <span className="shrink-0 rounded-full border border-cream-300 px-2.5 py-0.5 font-mono text-[11px] text-charcoal-faint">
                  {t.kind}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* single-spec quote stub */}
      <section className="mt-10">
        {requested ? (
          <div className="flex items-center gap-2 rounded-lg border border-status-good/40 bg-status-good/10 px-4 py-3 font-sans text-sm text-charcoal">
            <Check size={16} className="text-status-good" /> Specification request sent (stub).
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRequested(true)}
            className="bg-charcoal px-5 py-2.5 font-sans text-sm font-medium tracking-wide text-cream shadow-sm transition-colors hover:bg-charcoal-light"
          >
            Request a specification quote
          </button>
        )}
      </section>
    </div>
  )
}

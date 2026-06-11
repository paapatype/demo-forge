import type { Analysis } from '../../schema'
import { useReveal } from '../common/useReveal'

const FIT_TONE: Record<string, string> = {
  strong: 'text-status-good',
  medium: 'text-status-warn',
  weak: 'text-charcoal-faint',
}

export default function CatalogHeader({ analysis }: { analysis: Analysis }) {
  const { meta, about, trustSignals, archetype, viability } = analysis
  const confidence = Math.round(archetype.confidence * 100)
  const ref = useReveal<HTMLDivElement>()

  return (
    <div ref={ref} className="px-8 pb-3 pt-9">
      {analysis.brand.logo && (
        <img
          src={analysis.brand.logo}
          alt={`${meta.client} logo`}
          className="mb-4 h-10 w-auto max-w-[200px] object-contain object-left"
        />
      )}
      <p className="eyebrow">
        {archetype.primary === 'hybrid' ? 'Hybrid catalogue' : 'Catalogue'} · {meta.pageCount} pp ·{' '}
        {meta.flavor}
      </p>
      <h1 className="mt-2 text-5xl leading-[1.1] tracking-tight">{meta.client}</h1>
      {about.blurb && (
        <p className="mt-3 max-w-prose font-sans text-base text-charcoal-muted">{about.blurb}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2" data-path="archetype">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1 font-mono text-xs text-cream">
          {archetype.buyerAction === 'pick' ? 'pick' : archetype.buyerAction} · {confidence}% sure
        </span>
        <span className={`font-mono text-xs ${FIT_TONE[viability.fitForCatalog]}`}>
          catalogue fit: {viability.fitForCatalog}
        </span>
        <span className="text-cream-300">·</span>
        {trustSignals.slice(0, 5).map((t) => (
          <span
            key={t.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-surface px-2.5 py-1 font-sans text-xs text-charcoal-muted"
            title={t.couldBeFilter ? 'Could become a buyer-facing filter' : t.type}
          >
            {t.couldBeFilter && <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />}
            {t.label}
          </span>
        ))}
      </div>
    </div>
  )
}

import { useAnalysisStore } from '../store/useAnalysisStore'
import BrandRoot from '../components/layout/BrandRoot'
import CatalogView from '../components/catalog/CatalogView'
import ConfiguratorView from '../components/configurator/ConfiguratorView'

/**
 * The public-facing catalogue: brand-themed, filterable, with detail views and the quote cart —
 * the renderer minus all review chrome. This is what ships in a standalone build.
 */
export default function ViewerApp() {
  const analysis = useAnalysisStore((s) => s.analysis)
  if (!analysis) return null

  const primary = analysis.archetype.primary
  const main =
    primary === 'configurator' && analysis.core.configurator ? (
      <ConfiguratorView analysis={analysis} />
    ) : analysis.core.catalog ? (
      <CatalogView />
    ) : (
      <ConfiguratorView analysis={analysis} />
    )

  return (
    <BrandRoot brand={analysis.brand} className="contents">
      {/* In the standalone there's no review panel, so the floating quote button sits at the edge. */}
      <style>{`@media (min-width:1280px){.df-quote-fab{right:1.5rem !important}}`}</style>
      <div className="min-h-screen bg-cream text-charcoal">
        <header className="flex h-12 items-center justify-between border-b border-cream-300 px-5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-terracotta" />
            <span className="font-serif text-sm text-charcoal">{analysis.meta.client}</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal-faint">
            Powered by IndexArch
          </span>
        </header>
        {main}
      </div>
    </BrandRoot>
  )
}

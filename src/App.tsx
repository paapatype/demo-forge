import { useAnalysisStore } from './store/useAnalysisStore'
import AppLayout from './components/layout/AppLayout'
import TopBar from './components/layout/TopBar'
import BrandRoot from './components/layout/BrandRoot'
import EmptyState from './components/common/EmptyState'
import LoadingPipeline from './components/common/LoadingPipeline'
import ErrorState from './components/common/ErrorState'
import CatalogView from './components/catalog/CatalogView'
import ConfiguratorView from './components/configurator/ConfiguratorView'
import ReviewPanel from './components/panel/ReviewPanel'

/** Shown when the archetype (possibly user-overridden) has no extracted core to render. */
function MissingCore({ kind }: { kind: 'catalog' | 'configurator' }) {
  return (
    <div className="grid min-h-full place-items-center px-8 py-20 text-center">
      <div className="max-w-md">
        <h2 className="font-serif text-2xl text-charcoal">No {kind} structure extracted</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal-muted">
          The archetype is set to “{kind}”, but this analysis carries no <code>core.{kind}</code>{' '}
          data. Switch the archetype back in the review panel, or re-analyze the PDF.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const status = useAnalysisStore((s) => s.status)
  const analysis = useAnalysisStore((s) => s.analysis)

  let main
  if (status === 'loading') main = <LoadingPipeline />
  else if (status === 'error') main = <ErrorState />
  else if (!analysis) main = <EmptyState />
  else if (analysis.archetype.primary === 'configurator') {
    main = analysis.core.configurator ? (
      <ConfiguratorView analysis={analysis} />
    ) : (
      <MissingCore kind="configurator" />
    )
  } else if (analysis.archetype.primary === 'hybrid') {
    // Hybrid: the catalogue is primary; the configurator preview surfaces alongside (§7).
    main = (
      <>
        {analysis.core.catalog ? <CatalogView /> : <MissingCore kind="catalog" />}
        {analysis.core.configurator && (
          <div className="border-t border-cream-300">
            <ConfiguratorView analysis={analysis} />
          </div>
        )}
      </>
    )
  } else {
    main = analysis.core.catalog ? <CatalogView /> : <MissingCore kind="catalog" />
  }

  const showPanel = status === 'loaded' && !!analysis
  const layout = (
    <AppLayout topBar={<TopBar />} main={main} panel={showPanel ? <ReviewPanel /> : undefined} />
  )

  // Brand vars scope to product presentation; chrome (top bar, panel) uses chrome tokens only.
  return analysis ? (
    <BrandRoot brand={analysis.brand} className="contents">
      {layout}
    </BrandRoot>
  ) : (
    layout
  )
}

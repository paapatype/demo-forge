import { useMemo } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { selectFilteredFamilies } from '../../store/selectors'
import CatalogHeader from './CatalogHeader'
import FilterBar from './FilterBar'
import FamilyGrid from './FamilyGrid'
import FamilyDetail from './FamilyDetail'
import QuoteCart from './QuoteCart'

export default function CatalogView() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const activeFilters = useAnalysisStore((s) => s.activeFilters)
  const families = analysis?.core.catalog?.families ?? []
  const filtered = useMemo(
    () => selectFilteredFamilies(families, activeFilters),
    [families, activeFilters],
  )

  if (!analysis) return null

  return (
    <div className="pb-24">
      <CatalogHeader analysis={analysis} />
      <FilterBar total={families.length} shown={filtered.length} />
      <div className="px-8 py-6">
        <FamilyGrid families={filtered} />
      </div>
      <FamilyDetail />
      <QuoteCart />
    </div>
  )
}

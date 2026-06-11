import type { Family } from '../../schema'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import FamilyCard from './FamilyCard'

export default function FamilyGrid({ families }: { families: Family[] }) {
  const clearAllFilters = useAnalysisStore((s) => s.clearAllFilters)

  if (families.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-cream-300 bg-surface px-8 py-16 text-center">
        <p className="font-serif text-lg text-charcoal">No families match these filters</p>
        <p className="mt-1 font-sans text-sm text-charcoal-muted">Loosen or clear them to see more.</p>
        <button
          type="button"
          onClick={clearAllFilters}
          className="mt-4 bg-charcoal px-4 py-2 font-sans text-sm font-medium tracking-wide text-cream hover:bg-charcoal-light"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
      {families.map((f) => (
        <FamilyCard key={f.id} family={f} />
      ))}
    </div>
  )
}

import { useAnalysisStore } from '../../store/useAnalysisStore'
import { activeFilterCount } from '../../store/selectors'
import { displayUnit, formatNum, type FilterSchemaEntry } from '../../schema'
import Popover from '../common/Popover'
import RangeSlider from '../common/RangeSlider'
import { Check, Filter } from '../common/icons'

export default function FilterBar({ total, shown }: { total: number; shown: number }) {
  const filterSchema = useAnalysisStore((s) => s.analysis?.core.catalog?.filterSchema) ?? []
  const activeFilters = useAnalysisStore((s) => s.activeFilters)
  const setCategoricalFilter = useAnalysisStore((s) => s.setCategoricalFilter)
  const setRangeFilter = useAnalysisStore((s) => s.setRangeFilter)
  const clearFilter = useAnalysisStore((s) => s.clearFilter)
  const clearAllFilters = useAnalysisStore((s) => s.clearAllFilters)

  const activeCount = activeFilterCount(activeFilters)

  return (
    <div className="sticky top-0 z-10 border-y border-cream-300 bg-cream/95 px-8 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-charcoal-faint">
          <Filter size={14} /> Filters
        </span>

        {filterSchema.map((entry) =>
          entry.type === 'categorical' ? (
            <CategoricalFilter
              key={entry.key}
              entry={entry}
              selected={
                activeFilters[entry.key]?.kind === 'categorical'
                  ? (activeFilters[entry.key] as { selected: string[] }).selected
                  : []
              }
              onToggle={(v, on) => setCategoricalFilter(entry.key, v, on)}
            />
          ) : (
            <RangeFilter
              key={entry.key}
              entry={entry}
              value={
                activeFilters[entry.key]?.kind === 'range'
                  ? [
                      (activeFilters[entry.key] as { lo: number; hi: number }).lo,
                      (activeFilters[entry.key] as { lo: number; hi: number }).hi,
                    ]
                  : null
              }
              onChange={(lo, hi) => {
                const r = entry.range!
                if (lo <= r.min && hi >= r.max) clearFilter(entry.key)
                else setRangeFilter(entry.key, lo, hi)
              }}
              onReset={() => clearFilter(entry.key)}
            />
          ),
        )}

        <div className="ml-auto flex items-center gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="font-sans text-xs text-charcoal underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
          <span className="font-mono text-xs text-charcoal-muted">
            <span className="text-charcoal">{shown}</span> of {total} families
          </span>
        </div>
      </div>
    </div>
  )
}

function CategoricalFilter({
  entry,
  selected,
  onToggle,
}: {
  entry: FilterSchemaEntry
  selected: string[]
  onToggle: (value: string, on: boolean) => void
}) {
  return (
    <Popover label={entry.label} count={selected.length} active={selected.length > 0}>
      {() => (
        <div className="max-h-72 min-w-[12rem] overflow-auto">
          {(entry.values ?? []).map((v) => {
            const on = selected.includes(v)
            return (
              <button
                key={v}
                type="button"
                onClick={() => onToggle(v, !on)}
                className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-cream-200"
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded border ${
                    on ? 'border-charcoal bg-charcoal text-cream' : 'border-cream-300 bg-surface'
                  }`}
                >
                  {on && <Check size={11} />}
                </span>
                <span className="font-sans text-sm text-charcoal">{v}</span>
              </button>
            )
          })}
        </div>
      )}
    </Popover>
  )
}

function RangeFilter({
  entry,
  value,
  onChange,
  onReset,
}: {
  entry: FilterSchemaEntry
  value: [number, number] | null
  onChange: (lo: number, hi: number) => void
  onReset: () => void
}) {
  const r = entry.range!
  const unit = displayUnit(entry.unit, entry.normalizedUnit)
  const current: [number, number] = value ?? [r.min, r.max]
  const active = value !== null

  return (
    <Popover
      label={
        active ? `${entry.label}: ${formatNum(current[0])}–${formatNum(current[1])}` : entry.label
      }
      active={active}
      panelClassName="w-64"
    >
      {() => (
        <div className="px-2 py-2">
          <RangeSlider
            min={r.min}
            max={r.max}
            value={current}
            onChange={([lo, hi]) => onChange(lo, hi)}
            format={(n) => `${formatNum(n)}${unit ? ` ${unit}` : ''}`}
          />
          {active && (
            <button
              type="button"
              onClick={onReset}
              className="mt-3 font-sans text-xs text-charcoal underline-offset-2 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </Popover>
  )
}

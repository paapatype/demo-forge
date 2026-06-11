/**
 * Pure filtering selectors. A family passes the active filters when it satisfies EVERY active
 * group (AND): a categorical group needs the family to offer at least one selected value; a range
 * group needs the family's axis range to overlap the selected window. A family that lacks the axis
 * a filter targets does not pass it (selecting a property narrows to families that have it).
 */
import type { Family } from '../schema'

export interface CategoricalSelection {
  kind: 'categorical'
  selected: string[]
}
export interface RangeSelection {
  kind: 'range'
  lo: number
  hi: number
}
export type ActiveFilter = CategoricalSelection | RangeSelection
export type ActiveFilters = Record<string, ActiveFilter>

export function familyMatchesFilters(fam: Family, filters: ActiveFilters): boolean {
  for (const [key, f] of Object.entries(filters)) {
    const ax = fam.variantAxes.find((a) => a.key === key)
    if (f.kind === 'categorical') {
      if (f.selected.length === 0) continue // empty selection = inactive
      if (!ax || !ax.values) return false
      if (!ax.values.some((v) => f.selected.includes(v))) return false
    } else {
      if (!ax || !ax.range) return false
      const overlaps = ax.range.min <= f.hi && ax.range.max >= f.lo
      if (!overlaps) return false
    }
  }
  return true
}

export function selectFilteredFamilies(families: Family[], filters: ActiveFilters): Family[] {
  return families.filter((fam) => familyMatchesFilters(fam, filters))
}

/** How many active filter groups actually constrain (for the "clear filters" affordance). */
export function activeFilterCount(filters: ActiveFilters): number {
  return Object.values(filters).filter((f) =>
    f.kind === 'categorical' ? f.selected.length > 0 : true,
  ).length
}

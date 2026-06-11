/**
 * filterSchema derivation — the single most valuable output. Buyer-facing filters are the
 * variantAxes where `isFilter && !isIdentifier`, aggregated across families by axis key:
 *  - categorical → union of values
 *  - numeric / dimension → union of ranges (assumed in normalized units; units are per-family so
 *    the brain/operator must give a filterable numeric axis a consistent normalizedUnit per key)
 *
 * Recompute whenever a filter is toggled (the store calls this after every relevant edit).
 */
import type { Family, FilterSchemaEntry, NumericRange, VariantAxis } from './types'

export function deriveFilterSchema(families: Family[]): FilterSchemaEntry[] {
  const groups = new Map<string, { axis: VariantAxis; familyId: string }[]>()

  for (const fam of families) {
    for (const ax of fam.variantAxes) {
      if (!ax.isFilter || ax.isIdentifier) continue
      const list = groups.get(ax.key) ?? []
      list.push({ axis: ax, familyId: fam.id })
      groups.set(ax.key, list)
    }
  }

  const out: FilterSchemaEntry[] = []
  for (const [key, items] of groups) {
    const first = items[0].axis
    const familyIds = [...new Set(items.map((i) => i.familyId))]

    if (first.type === 'categorical') {
      const values = new Set<string>()
      for (const it of items) for (const v of it.axis.values ?? []) values.add(v)
      out.push({
        key,
        label: first.label,
        type: first.type,
        unit: first.unit,
        normalizedUnit: first.normalizedUnit,
        values: [...values],
        range: null,
        familyIds,
      })
    } else {
      let min = Infinity
      let max = -Infinity
      for (const it of items) {
        if (it.axis.range) {
          min = Math.min(min, it.axis.range.min)
          max = Math.max(max, it.axis.range.max)
        }
      }
      const range: NumericRange | null = Number.isFinite(min) ? { min, max } : null
      out.push({
        key,
        label: first.label,
        type: first.type,
        unit: first.unit,
        normalizedUnit: first.normalizedUnit,
        values: null,
        range,
        familyIds,
      })
    }
  }

  return out
}

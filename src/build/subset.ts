/**
 * Narrow a catalogue analysis to a subset of families (for the 5-product demo). Recomputes the
 * filter schema so the demo's filter bar only shows what the chosen families actually expose.
 */
import { deriveFilterSchema, type Analysis } from '../schema'

export function subsetAnalysis(analysis: Analysis, familyIds: string[]): Analysis {
  const next = structuredClone(analysis)
  if (next.core.catalog) {
    const keep = new Set(familyIds)
    next.core.catalog.families = next.core.catalog.families.filter((f) => keep.has(f.id))
    next.core.catalog.filterSchema = deriveFilterSchema(next.core.catalog.families)
  }
  return next
}

/**
 * Suggest the strongest ~N families to feature in a demo: rank by buyer-facing filter axes, variant
 * breadth, enabled experience modules, and image quality. Operator can still swap any.
 */
export function suggestDemoFamilies(analysis: Analysis, n = 5): string[] {
  const families = analysis.core.catalog?.families ?? []
  const ranked = [...families]
    .map((f) => {
      const filters = f.variantAxes.filter((a) => a.isFilter && !a.isIdentifier).length
      const variants = f.variantAxes.reduce((sum, a) => sum + (a.values?.length ?? 2), 0)
      const modules = f.experienceModules.length
      const img = f.images[0]
      const imageScore = img && !img.missing ? (img.quality === 'good' ? 2 : 1) : 0
      return { id: f.id, score: filters * 3 + modules * 2 + imageScore * 2 + Math.min(variants, 8) }
    })
    .sort((a, b) => b.score - a.score)
  return ranked.slice(0, n).map((r) => r.id)
}

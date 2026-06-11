/**
 * Pure, immutable edit actions over the working Analysis. Every edit returns a NEW object (the
 * preview re-renders from it), and any edit that can change a buyer-facing filter recomputes
 * core.catalog.filterSchema so the filter bar stays live (§8).
 *
 * Axis-level edits address axes by index (the panel renders them by index — unambiguous).
 */
import { EXPERIENCE_MODULES, deriveFilterSchema } from '../schema'
import type {
  Analysis,
  ArchetypePrimary,
  BrandColors,
  BuyerAction,
  ExperienceModule,
  Family,
  FamilyPresentation,
  ImageRef,
  NumericRange,
  Research,
  ThreeDTier,
  VariantAxis,
} from '../schema'

const clone = (a: Analysis): Analysis => structuredClone(a)

function recomputeFilters(a: Analysis): void {
  if (a.core.catalog) a.core.catalog.filterSchema = deriveFilterSchema(a.core.catalog.families)
}

function withFamily(a: Analysis, familyId: string, fn: (f: Family) => void): Analysis {
  const next = clone(a)
  const fam = next.core.catalog?.families.find((f) => f.id === familyId)
  if (fam) fn(fam)
  return next
}

function withAxis(
  a: Analysis,
  familyId: string,
  axisIndex: number,
  fn: (ax: VariantAxis) => void,
): Analysis {
  const next = clone(a)
  const fam = next.core.catalog?.families.find((f) => f.id === familyId)
  const ax = fam?.variantAxes[axisIndex]
  if (ax) fn(ax)
  recomputeFilters(next) // axis edits can change the filter schema (isFilter/values/range/label)
  return next
}

// ───────────────────────────── families ─────────────────────────────

export const renameFamily = (a: Analysis, id: string, name: string) =>
  withFamily(a, id, (f) => {
    f.name = name
  })

export const editFamilyDescription = (a: Analysis, id: string, description: string) =>
  withFamily(a, id, (f) => {
    f.description = description
  })

// ───────────────────────────── variant axes (data controls) ─────────────────────────────

export const toggleAxisFilter = (a: Analysis, id: string, axisIndex: number) =>
  withAxis(a, id, axisIndex, (ax) => {
    if (!ax.isIdentifier) ax.isFilter = !ax.isFilter
  })

export const toggleAxisIdentifier = (a: Analysis, id: string, axisIndex: number) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.isIdentifier = !ax.isIdentifier
    if (ax.isIdentifier) ax.isFilter = false // an identifier is never a filter
  })

export const renameAxisLabel = (a: Analysis, id: string, axisIndex: number, label: string) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.label = label
  })

export const setAxisUnit = (a: Analysis, id: string, axisIndex: number, unit: string | null) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.unit = unit
  })

export const setAxisNormalizedUnit = (
  a: Analysis,
  id: string,
  axisIndex: number,
  normalizedUnit: string | null,
) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.normalizedUnit = normalizedUnit
  })

export const setAxisValues = (a: Analysis, id: string, axisIndex: number, values: string[]) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.values = values
  })

export const setAxisRange = (a: Analysis, id: string, axisIndex: number, range: NumericRange) =>
  withAxis(a, id, axisIndex, (ax) => {
    ax.range = range
  })

// ───────────────────────────── visual controls (presentation) ─────────────────────────────

export const setExperienceModule = (
  a: Analysis,
  id: string,
  module: ExperienceModule,
  enabled: boolean,
) =>
  withFamily(a, id, (f) => {
    const set = new Set(f.experienceModules)
    if (enabled) set.add(module)
    else set.delete(module)
    f.experienceModules = EXPERIENCE_MODULES.filter((m) => set.has(m)) // canonical order
  })

export const setThreeDWarranted = (a: Analysis, id: string, warranted: boolean) =>
  withFamily(a, id, (f) => {
    f.threeD.warranted = warranted
    const set = new Set(f.experienceModules)
    if (warranted) set.add('threeDSpin')
    else set.delete('threeDSpin')
    f.experienceModules = EXPERIENCE_MODULES.filter((m) => set.has(m))
  })

export const setThreeDTier = (a: Analysis, id: string, tier: ThreeDTier) =>
  withFamily(a, id, (f) => {
    f.threeD.tier = tier
  })

export const setFamilyPresentation = (
  a: Analysis,
  id: string,
  patch: Partial<FamilyPresentation>,
) =>
  withFamily(a, id, (f) => {
    const base: FamilyPresentation = f.presentation ?? { cardSize: 'md', detailSize: 'lg' }
    f.presentation = { ...base, ...patch }
  })

export const setSwatchAxisKey = (a: Analysis, id: string, key: string | null) =>
  withFamily(a, id, (f) => {
    f.swatchAxisKey = key
  })

export const setSizeComparisonAxisKey = (a: Analysis, id: string, key: string | null) =>
  withFamily(a, id, (f) => {
    f.sizeComparisonAxisKey = key
  })

export const setFamilyImage = (
  a: Analysis,
  id: string,
  imageIndex: number,
  patch: Partial<ImageRef>,
) =>
  withFamily(a, id, (f) => {
    const img = f.images[imageIndex]
    if (img) Object.assign(img, patch)
  })

// ───────────────────────────── archetype / flags / brand ─────────────────────────────

const CANONICAL_BUYER_ACTION: Record<ArchetypePrimary, BuyerAction> = {
  catalog: 'pick',
  configurator: 'specify',
  hybrid: 'both',
}

export function overrideArchetype(a: Analysis, primary: ArchetypePrimary): Analysis {
  const next = clone(a)
  next.archetype.primary = primary
  next.archetype.buyerAction = CANONICAL_BUYER_ACTION[primary]
  return next
}

export function setBuyerAction(a: Analysis, buyerAction: BuyerAction): Analysis {
  const next = clone(a)
  next.archetype.buyerAction = buyerAction
  return next
}

export function setFlagDismissed(a: Analysis, flagIndex: number, dismissed: boolean): Analysis {
  const next = clone(a)
  const flag = next.confidenceFlags[flagIndex]
  if (flag) flag.dismissed = dismissed
  return next
}

export function setBrandColor(a: Analysis, which: keyof BrandColors, hex: string): Analysis {
  const next = clone(a)
  next.brand.colors[which] = hex
  return next
}

export function setLogo(a: Analysis, logo: string | null): Analysis {
  const next = clone(a)
  next.brand.logo = logo
  return next
}

export function setClientName(a: Analysis, client: string): Analysis {
  const next = clone(a)
  next.meta.client = client
  return next
}

// ───────────────────────────── research layer (v0.5) ─────────────────────────────

export function setResearch(a: Analysis, research: Research): Analysis {
  const next = clone(a)
  next.research = research
  return next
}

export function rejectRecommendation(a: Analysis, recId: string): Analysis {
  const next = clone(a)
  const rec = next.research?.recommendations.find((r) => r.id === recId)
  if (rec) rec.status = 'rejected'
  return next
}

/** Accept a recommendation: record the decision and apply its wiring (modules/presentation) live. */
export function acceptRecommendation(a: Analysis, recId: string): Analysis {
  const next = clone(a)
  const rec = next.research?.recommendations.find((r) => r.id === recId)
  if (!rec) return next
  rec.status = 'accepted'

  const families = next.core.catalog?.families ?? []
  const targets = rec.familyId ? families.filter((f) => f.id === rec.familyId) : families
  for (const fam of targets) {
    if (rec.wiring.enableModules.length > 0) {
      const set = new Set(fam.experienceModules)
      for (const m of rec.wiring.enableModules) set.add(m)
      fam.experienceModules = EXPERIENCE_MODULES.filter((m) => set.has(m))
    }
    if (rec.wiring.presentation) {
      const base: FamilyPresentation = fam.presentation ?? { cardSize: 'md', detailSize: 'lg' }
      fam.presentation = { ...base, ...rec.wiring.presentation }
    }
  }
  return next
}

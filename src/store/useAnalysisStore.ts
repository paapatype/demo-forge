/**
 * The single working-analysis store (§2). One object holds the analysis; every panel edit mutates
 * it and the preview re-renders live. UI state (selection, filters, cart) lives here too. No browser
 * storage — all in memory (§12).
 */
import { create } from 'zustand'
import { deriveFilterSchema } from '../schema'
import type {
  Analysis,
  ArchetypePrimary,
  BrandColors,
  BuyerAction,
  ExperienceModule,
  FamilyPresentation,
  ImageRef,
  NumericRange,
  ThreeDTier,
} from '../schema'
import {
  AnalyzeError,
  analyze,
  loadFixture,
  type AnalyzeErrorKind,
  type AnalyzeStage,
} from '../brain/client'
import type { FixtureKey } from '../brain/mock'
import { requestResearch, type ResearchStage } from '../research/researchClient'
import * as edits from './edits'
import type { ActiveFilter, ActiveFilters, CategoricalSelection } from './selectors'

export interface CartLine {
  id: string
  familyId: string
  familyName: string
  variantLabel: string
  selections: Record<string, string>
  qty: number
}

type Status = 'idle' | 'loading' | 'loaded' | 'error'

export interface AnalysisState {
  analysis: Analysis | null
  status: Status
  loadingStage: AnalyzeStage | null
  loadingIndex: number
  error: { message: string; kind: AnalyzeErrorKind } | null
  sourceFileName: string | null
  /** The original uploaded PDF, kept in memory so Approve & Build can file it in the library. */
  sourceFile: File | null
  mockFixture: FixtureKey

  // UI state
  selectedFamilyId: string | null
  activeFilters: ActiveFilters
  cart: CartLine[]

  // research layer (v0.5)
  researchStatus: 'idle' | 'researching' | 'done' | 'error'
  researchStage: ResearchStage | null
  researchError: string | null

  // lifecycle
  runAnalyze: (file: File | null, fixture?: FixtureKey) => Promise<void>
  loadFixtureNow: (key: FixtureKey) => void
  /** Load an already-validated analysis (e.g. reopened from the library). */
  loadAnalysis: (analysis: Analysis) => void
  setMockFixture: (key: FixtureKey) => void
  reset: () => void

  // navigation / filters
  setSelectedFamily: (id: string | null) => void
  setCategoricalFilter: (key: string, value: string, on: boolean) => void
  setRangeFilter: (key: string, lo: number, hi: number) => void
  clearFilter: (key: string) => void
  clearAllFilters: () => void

  // quote cart
  addToCart: (line: Omit<CartLine, 'id'>) => void
  setCartQty: (id: string, qty: number) => void
  removeCartLine: (id: string) => void
  clearCart: () => void

  // analysis edits (delegate to edits.ts; the preview re-renders from `analysis`)
  renameFamily: (id: string, name: string) => void
  editFamilyDescription: (id: string, description: string) => void
  toggleAxisFilter: (id: string, axisIndex: number) => void
  toggleAxisIdentifier: (id: string, axisIndex: number) => void
  renameAxisLabel: (id: string, axisIndex: number, label: string) => void
  setAxisUnit: (id: string, axisIndex: number, unit: string | null) => void
  setAxisNormalizedUnit: (id: string, axisIndex: number, normalizedUnit: string | null) => void
  setAxisValues: (id: string, axisIndex: number, values: string[]) => void
  setAxisRange: (id: string, axisIndex: number, range: NumericRange) => void
  setExperienceModule: (id: string, module: ExperienceModule, enabled: boolean) => void
  setThreeDWarranted: (id: string, warranted: boolean) => void
  setThreeDTier: (id: string, tier: ThreeDTier) => void
  setFamilyPresentation: (id: string, patch: Partial<FamilyPresentation>) => void
  setSwatchAxisKey: (id: string, key: string | null) => void
  setSizeComparisonAxisKey: (id: string, key: string | null) => void
  setFamilyImage: (id: string, imageIndex: number, patch: Partial<ImageRef>) => void
  overrideArchetype: (primary: ArchetypePrimary) => void
  setBuyerAction: (action: BuyerAction) => void
  setFlagDismissed: (flagIndex: number, dismissed: boolean) => void
  setBrandColor: (which: keyof BrandColors, hex: string) => void
  setLogo: (logo: string | null) => void
  setClientName: (client: string) => void

  // research actions
  runResearch: () => Promise<void>
  acceptRecommendation: (recId: string) => void
  rejectRecommendation: (recId: string) => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => {
  let controller: AbortController | null = null

  const edit = (fn: (a: Analysis) => Analysis) => {
    const a = get().analysis
    if (!a) return
    const next = fn(a)
    // An edit can shrink the filter schema (isFilter off, identifier on). Prune active filters
    // whose key no longer exists, or a now-invisible filter would keep constraining the grid.
    const keys = new Set((next.core.catalog?.filterSchema ?? []).map((e) => e.key))
    const activeFilters = Object.fromEntries(
      Object.entries(get().activeFilters).filter(([k]) => keys.has(k)),
    )
    set({ analysis: next, activeFilters })
  }

  const commitAnalysis = (analysis: Analysis) => {
    if (analysis.core.catalog) {
      analysis.core.catalog.filterSchema = deriveFilterSchema(analysis.core.catalog.families)
    }
    set({
      analysis,
      status: 'loaded',
      error: null,
      loadingStage: null,
      selectedFamilyId: null,
      activeFilters: {},
      cart: [],
      researchStatus: analysis.research ? 'done' : 'idle',
      researchStage: null,
      researchError: null,
    })
  }

  return {
    analysis: null,
    status: 'idle',
    loadingStage: null,
    loadingIndex: 0,
    error: null,
    sourceFileName: null,
    sourceFile: null,
    mockFixture: 'catalog',
    selectedFamilyId: null,
    activeFilters: {},
    cart: [],
    researchStatus: 'idle',
    researchStage: null,
    researchError: null,

    runAnalyze: async (file, fixture) => {
      controller?.abort()
      controller = new AbortController()
      const useFixture = fixture ?? get().mockFixture
      set({
        status: 'loading',
        error: null,
        loadingStage: null,
        loadingIndex: 0,
        sourceFileName: file?.name ?? null,
        sourceFile: file,
      })
      try {
        const analysis = await analyze(file, {
          mockFixture: useFixture,
          signal: controller.signal,
          onStage: (stage, index) => set({ loadingStage: stage, loadingIndex: index }),
        })
        commitAnalysis(analysis)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        const error =
          e instanceof AnalyzeError
            ? { message: e.message, kind: e.kind }
            : { message: (e as Error).message ?? 'Unknown error', kind: 'server' as AnalyzeErrorKind }
        set({ status: 'error', error, loadingStage: null })
      }
    },

    loadFixtureNow: (key) => {
      try {
        const analysis = loadFixture(key)
        set({ sourceFileName: null, sourceFile: null, mockFixture: key })
        commitAnalysis(analysis)
      } catch (e) {
        set({ status: 'error', error: { message: (e as Error).message, kind: 'malformed' } })
      }
    },

    loadAnalysis: (analysis) => {
      set({ sourceFileName: analysis.meta.sourceFile || null, sourceFile: null })
      commitAnalysis(analysis)
    },

    setMockFixture: (key) => set({ mockFixture: key }),

    reset: () => {
      controller?.abort()
      set({
        analysis: null,
        status: 'idle',
        error: null,
        loadingStage: null,
        loadingIndex: 0,
        selectedFamilyId: null,
        activeFilters: {},
        cart: [],
        sourceFileName: null,
        sourceFile: null,
        researchStatus: 'idle',
        researchStage: null,
        researchError: null,
      })
    },

    setSelectedFamily: (id) => set({ selectedFamilyId: id }),

    setCategoricalFilter: (key, value, on) =>
      set((s) => {
        const cur = s.activeFilters[key]
        const selected = new Set(cur && cur.kind === 'categorical' ? cur.selected : [])
        if (on) selected.add(value)
        else selected.delete(value)
        const next: ActiveFilters = { ...s.activeFilters }
        if (selected.size === 0) delete next[key]
        else {
          const entry: CategoricalSelection = { kind: 'categorical', selected: [...selected] }
          next[key] = entry
        }
        return { activeFilters: next }
      }),

    setRangeFilter: (key, lo, hi) =>
      set((s) => {
        const entry: ActiveFilter = { kind: 'range', lo, hi }
        return { activeFilters: { ...s.activeFilters, [key]: entry } }
      }),

    clearFilter: (key) =>
      set((s) => {
        const next: ActiveFilters = { ...s.activeFilters }
        delete next[key]
        return { activeFilters: next }
      }),

    clearAllFilters: () => set({ activeFilters: {} }),

    addToCart: (line) =>
      set((s) => ({ cart: [...s.cart, { ...line, id: crypto.randomUUID() }] })),
    setCartQty: (id, qty) =>
      set((s) => ({
        cart: s.cart.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)),
      })),
    removeCartLine: (id) => set((s) => ({ cart: s.cart.filter((l) => l.id !== id) })),
    clearCart: () => set({ cart: [] }),

    renameFamily: (id, name) => edit((a) => edits.renameFamily(a, id, name)),
    editFamilyDescription: (id, description) =>
      edit((a) => edits.editFamilyDescription(a, id, description)),
    toggleAxisFilter: (id, axisIndex) => edit((a) => edits.toggleAxisFilter(a, id, axisIndex)),
    toggleAxisIdentifier: (id, axisIndex) =>
      edit((a) => edits.toggleAxisIdentifier(a, id, axisIndex)),
    renameAxisLabel: (id, axisIndex, label) =>
      edit((a) => edits.renameAxisLabel(a, id, axisIndex, label)),
    setAxisUnit: (id, axisIndex, unit) => edit((a) => edits.setAxisUnit(a, id, axisIndex, unit)),
    setAxisNormalizedUnit: (id, axisIndex, normalizedUnit) =>
      edit((a) => edits.setAxisNormalizedUnit(a, id, axisIndex, normalizedUnit)),
    setAxisValues: (id, axisIndex, values) =>
      edit((a) => edits.setAxisValues(a, id, axisIndex, values)),
    setAxisRange: (id, axisIndex, range) => edit((a) => edits.setAxisRange(a, id, axisIndex, range)),
    setExperienceModule: (id, module, enabled) =>
      edit((a) => edits.setExperienceModule(a, id, module, enabled)),
    setThreeDWarranted: (id, warranted) => edit((a) => edits.setThreeDWarranted(a, id, warranted)),
    setThreeDTier: (id, tier) => edit((a) => edits.setThreeDTier(a, id, tier)),
    setFamilyPresentation: (id, patch) => edit((a) => edits.setFamilyPresentation(a, id, patch)),
    setSwatchAxisKey: (id, key) => edit((a) => edits.setSwatchAxisKey(a, id, key)),
    setSizeComparisonAxisKey: (id, key) =>
      edit((a) => edits.setSizeComparisonAxisKey(a, id, key)),
    setFamilyImage: (id, imageIndex, patch) =>
      edit((a) => edits.setFamilyImage(a, id, imageIndex, patch)),
    overrideArchetype: (primary) => edit((a) => edits.overrideArchetype(a, primary)),
    setBuyerAction: (action) => edit((a) => edits.setBuyerAction(a, action)),
    setFlagDismissed: (flagIndex, dismissed) =>
      edit((a) => edits.setFlagDismissed(a, flagIndex, dismissed)),
    setBrandColor: (which, hex) => edit((a) => edits.setBrandColor(a, which, hex)),
    setLogo: (logo) => edit((a) => edits.setLogo(a, logo)),
    setClientName: (client) => edit((a) => edits.setClientName(a, client)),

    runResearch: async () => {
      const a = get().analysis
      if (!a || get().researchStatus === 'researching') return
      set({ researchStatus: 'researching', researchError: null, researchStage: null })
      try {
        const research = await requestResearch(a, { onStage: (stage) => set({ researchStage: stage }) })
        const cur = get().analysis
        if (cur) {
          set({
            analysis: edits.setResearch(cur, research),
            researchStatus: 'done',
            researchStage: null,
          })
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        set({ researchStatus: 'error', researchError: (e as Error).message, researchStage: null })
      }
    },
    acceptRecommendation: (recId) => edit((a) => edits.acceptRecommendation(a, recId)),
    rejectRecommendation: (recId) => edit((a) => edits.rejectRecommendation(a, recId)),
  }
})

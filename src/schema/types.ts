/**
 * Demo Forge schema — the spine (§4 of the build spec).
 *
 * ONE schema. `archetype.primary` discriminates: `core.catalog` is present for catalog | hybrid;
 * `core.configurator` for configurator | hybrid. The brain writes this object, the UI renders and
 * edits it, and export emits it. This file is the single source of truth — keep it authoritative.
 *
 * A few fields are marked "v0 presentation extension": they are not in the original §4 core but
 * carry presentation state the right panel edits (§8). They live on the object so that, per §8,
 * every panel edit mutates this one object; they are optional so the brain need not emit them.
 */

// ───────────────────────────── enums / unions ─────────────────────────────

export type Flavor = 'digital' | 'image' | 'scanned'
export type ArchetypePrimary = 'catalog' | 'configurator' | 'hybrid'
export type SecondaryType = 'catalog' | 'configurator'
/** The load-bearing classification primitive: pick-from-a-set vs specify-a-requirement vs both. */
export type BuyerAction = 'pick' | 'specify' | 'both'

export type Fit = 'strong' | 'medium' | 'weak'
export type BuildComplexity = 'low' | 'medium' | 'high'

export type TrustSignalType = 'certification' | 'standard' | 'award'

export type ImageQuality = 'good' | 'low' | 'none'

export type ExperienceModule =
  | 'swatchSwitch'
  | 'sizeComparison'
  | 'rich2DZoom'
  | 'threeDSpin'
  | 'contextVisualizer'

export type ThreeDTier = 'A' | 'B' | 'C' | 'D'

export type AxisType = 'categorical' | 'numericRange' | 'dimension'
export type SpecInputKind = 'select' | 'range' | 'number' | 'text'

export type Severity = 'info' | 'warn' | 'high'

export type CatalogCartType = 'multiLineQuoteBuilder'
export type ConfiguratorCartType = 'singleSpecQuoteRequest'

// ───────────────────────────── meta / brand ─────────────────────────────

export interface Meta {
  client: string
  slug: string
  sourceFile: string
  pageCount: number
  flavor: Flavor
  generatedAt: string // ISO-8601
  modelUsed: string
}

export interface BrandColors {
  primary: string // #hex
  secondary: string // #hex
  accent: string // #hex
}

export interface Brand {
  logo: string | null // data URL or path
  colors: BrandColors
  fontOverride: string | null
}

// ───────────────────────────── archetype / viability ─────────────────────────────

export interface ArchetypeSecondary {
  type: SecondaryType
  confidence: number // 0..1
}

export interface Archetype {
  primary: ArchetypePrimary
  confidence: number // 0..1
  buyerAction: BuyerAction
  /** Concrete, human-readable reasons the user can eyeball. */
  evidence: string[]
  secondary: ArchetypeSecondary | null
}

export interface Viability {
  fitForCatalog: Fit
  fitForConfigurator: Fit
  buildComplexity: BuildComplexity
  notes: string
}

export interface TrustSignal {
  type: TrustSignalType
  label: string
  /** Some certifications/standards become buyer-facing filters. */
  couldBeFilter: boolean
}

export interface About {
  blurb: string | null
}

// ───────────────────────────── catalog core ─────────────────────────────

export interface ImageRef {
  src: string | null
  missing: boolean
  quality: ImageQuality
}

export interface ThreeD {
  /** Off by default; set true only via the §9 tiered gate. */
  warranted: boolean
  tier: ThreeDTier
  path: string | null
  cadLikely: boolean
}

export interface NumericRange {
  min: number
  max: number
}

export interface VariantAxis {
  key: string
  label: string
  type: AxisType
  unit: string | null
  normalizedUnit: string | null
  values: string[] | null // categorical (else null)
  range: NumericRange | null // numeric / dimension (else null)
  /** Promote to a buyer-facing filter? */
  isFilter: boolean
  /** e.g. a part number — an identifier, never a filter. */
  isIdentifier: boolean
}

export interface FamilyPresentation {
  cardSize: 'sm' | 'md' | 'lg'
  detailSize: 'sm' | 'md' | 'lg'
}

export interface Family {
  id: string
  name: string
  description: string
  images: ImageRef[]
  experienceModules: ExperienceModule[]
  threeD: ThreeD
  variantAxes: VariantAxis[]
  skuCount: number

  // ── v0 presentation extensions (optional; §8 visual controls) ──
  /** Display sizing for card + detail ("shape and size" control). */
  presentation?: FamilyPresentation
  /** Which variantAxis (by key) drives swatchSwitch. */
  swatchAxisKey?: string | null
  /** Which variantAxis (by key) drives the size-comparison visual. */
  sizeComparisonAxisKey?: string | null
}

/**
 * Buyer-facing filter, derived from variantAxes where `isFilter && !isIdentifier`, aggregated
 * across families by axis key. Recomputed whenever a filter is toggled (see deriveFilterSchema).
 */
export interface FilterSchemaEntry {
  key: string
  label: string
  type: AxisType
  unit: string | null
  normalizedUnit: string | null
  values: string[] | null // categorical: union across families
  range: NumericRange | null // numeric/dimension: union across families
  familyIds: string[] // families that expose this axis
}

export interface CatalogCart {
  type: CatalogCartType
}

export interface CatalogCore {
  families: Family[]
  /** Derived — never hand-authored as the source of truth. */
  filterSchema: FilterSchemaEntry[]
  cart: CatalogCart
}

// ───────────────────────────── configurator core ─────────────────────────────

export interface SpecAxis {
  key: string
  label: string
  inputKind: SpecInputKind
  type: AxisType
  unit: string | null
  values: string[] | null
  range: NumericRange | null
  helpText: string
  constraints: string | null
}

export interface Capability {
  title: string
  body: string
}

export interface TechLibItem {
  name: string
  kind: string
  note: string
}

export interface ConfiguratorCart {
  type: ConfiguratorCartType
}

export interface ConfiguratorCore {
  specAxes: SpecAxis[]
  capabilities: Capability[]
  technicalLibrary: TechLibItem[]
  cart: ConfiguratorCart
}

// ───────────────────────────── core / flags / root ─────────────────────────────

export interface Core {
  catalog?: CatalogCore // present for catalog | hybrid
  configurator?: ConfiguratorCore // present for configurator | hybrid
}

export interface ConfidenceFlag {
  /** JSON path into the object so the panel renders the flag next to its subject. */
  path: string
  message: string
  severity: Severity
  /** v0 panel extension: the user can dismiss/resolve a flag (§8). */
  dismissed?: boolean
}

// ───────────── research layer (v0.5 — optional; absent on plain v0 analyses) ─────────────

export type SourceKind = 'study' | 'book' | 'video' | 'exemplar' | 'article'
export type ClaimVerdict = 'verified' | 'plausible' | 'refuted' | 'unchecked'
export type RecImpact = 'high' | 'medium' | 'low'
export type RecStatus = 'proposed' | 'accepted' | 'rejected'

export interface Source {
  title: string
  url: string
  kind: SourceKind
}

export interface IndustryRead {
  industry: string
  buyerProfile: string
  channelNotes: string
}

/** A researched claim, each adversarially reviewed. Refuted claims never reach pitch/accepted recs. */
export interface ResearchClaim {
  id: string
  text: string
  sources: Source[]
  verdict: ClaimVerdict
  reviewerNote: string
}

/** What Accept applies live, through existing store actions (§7). */
export interface RecommendationWiring {
  enableModules: ExperienceModule[]
  presentation?: Partial<FamilyPresentation>
}

export interface ResearchRecommendation {
  id: string
  familyId: string | null // null = catalogue-wide
  patternId: string // → a PatternCard in knowledge/patterns/
  title: string
  rationale: string
  claimIds: string[]
  impact: RecImpact
  status: RecStatus
  wiring: RecommendationWiring
}

export interface ResearchExemplar {
  name: string
  url: string
  why: string
}

export interface ValuePitchMove {
  move: string
  why: string
  claimIds: string[]
}

export interface ValuePitch {
  headline: string
  narrative: string
  topMoves: ValuePitchMove[]
  nextStep: string
}

export interface ResearchMeta {
  researchedAt: string
  modelUsed: string
  webSearchUsed: boolean
  promptVersion: string
}

export interface Research {
  industryRead: IndustryRead
  claims: ResearchClaim[]
  recommendations: ResearchRecommendation[]
  exemplars: ResearchExemplar[]
  valuePitch: ValuePitch
  meta: ResearchMeta
}

// ───────────── client questions (v0.6 — contextual, generated with the analysis) ─────────────

export type QuestionTheme =
  | 'taxonomy'
  | 'filters'
  | 'imagery'
  | 'variants'
  | 'pricing'
  | 'compliance'
  | 'audience'
  | 'scope'
export type QuestionPriority = 'high' | 'medium' | 'low'

/** A specific question to ask the client to build their catalogue better, grounded in THEIR PDF. */
export interface ClientQuestion {
  id: string
  theme: QuestionTheme
  question: string
  /** Why it matters — tied to something concrete in this analysis (a flag, a unit, an ambiguity). */
  why: string
  priority: QuestionPriority
}

export interface Analysis {
  meta: Meta
  brand: Brand
  archetype: Archetype
  viability: Viability
  trustSignals: TrustSignal[]
  about: About
  core: Core
  confidenceFlags: ConfidenceFlag[]
  /** v0.5 merchandising research layer. Optional — plain v0 analyses omit it. */
  research?: Research
  /** v0.6 contextual questions to ask the client, grounded in this PDF. Optional. */
  clientQuestions?: ClientQuestion[]
}

// ───────────────────────────── enum value sets (for the validator/UI) ─────────────────────────────

export const FLAVORS: readonly Flavor[] = ['digital', 'image', 'scanned']
export const ARCHETYPES: readonly ArchetypePrimary[] = ['catalog', 'configurator', 'hybrid']
export const BUYER_ACTIONS: readonly BuyerAction[] = ['pick', 'specify', 'both']
export const FITS: readonly Fit[] = ['strong', 'medium', 'weak']
export const COMPLEXITIES: readonly BuildComplexity[] = ['low', 'medium', 'high']
export const TRUST_TYPES: readonly TrustSignalType[] = ['certification', 'standard', 'award']
export const IMAGE_QUALITIES: readonly ImageQuality[] = ['good', 'low', 'none']
export const EXPERIENCE_MODULES: readonly ExperienceModule[] = [
  'swatchSwitch',
  'sizeComparison',
  'rich2DZoom',
  'threeDSpin',
  'contextVisualizer',
]
export const THREE_D_TIERS: readonly ThreeDTier[] = ['A', 'B', 'C', 'D']
export const AXIS_TYPES: readonly AxisType[] = ['categorical', 'numericRange', 'dimension']
export const SPEC_INPUT_KINDS: readonly SpecInputKind[] = ['select', 'range', 'number', 'text']
export const SEVERITIES: readonly Severity[] = ['info', 'warn', 'high']

// client-question enums (v0.6)
export const QUESTION_THEMES: readonly QuestionTheme[] = [
  'taxonomy',
  'filters',
  'imagery',
  'variants',
  'pricing',
  'compliance',
  'audience',
  'scope',
]
export const QUESTION_PRIORITIES: readonly QuestionPriority[] = ['high', 'medium', 'low']

// research-layer enums (v0.5)
export const SOURCE_KINDS: readonly SourceKind[] = ['study', 'book', 'video', 'exemplar', 'article']
export const CLAIM_VERDICTS: readonly ClaimVerdict[] = [
  'verified',
  'plausible',
  'refuted',
  'unchecked',
]
export const REC_IMPACTS: readonly RecImpact[] = ['high', 'medium', 'low']
export const REC_STATUSES: readonly RecStatus[] = ['proposed', 'accepted', 'rejected']

// ───────────── Pattern Library (v0.5 — IndexArch IP in knowledge/patterns/*.json) ─────────────

export interface PatternEvidence {
  title: string
  url: string
  kind: SourceKind
  note: string
}

/**
 * A curated merchandising pattern card: the pattern, the logic a salesperson can say out loud, and
 * verified evidence. The researcher consults these; recommendations reference them by id.
 */
export interface PatternCard {
  id: string
  name: string
  logic: string
  applicableArchetypes: ArchetypePrimary[]
  applicableIndustries: string[]
  evidence: PatternEvidence[]
  exemplars: ResearchExemplar[]
  metricsNote: string
  reviewStatus: 'verified' | 'partial'
  lastReviewed: string
  version: string
}

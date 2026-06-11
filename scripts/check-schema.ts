/**
 * Logic check for the schema + store core (run: `npx tsx scripts/check-schema.ts`).
 * Verifies fixtures validate, malformed input is rejected, filterSchema derivation aggregates
 * correctly, and an edit recomputes filters immutably. Not a unit-test suite — a fast guard.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { deriveFilterSchema, validateAnalysis, type Analysis } from '../src/schema'
import { toggleAxisFilter } from '../src/store/edits'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const load = (name: string): unknown =>
  JSON.parse(readFileSync(join(root, 'fixtures', name), 'utf8'))

let failures = 0
const assert = (cond: boolean, msg: string) => {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`)
  if (!cond) failures++
}

console.log('Fixtures validate:')
for (const f of ['catalog.analysis.json', 'configurator.analysis.json']) {
  const res = validateAnalysis(load(f))
  assert(res.ok, `${f}${res.ok ? '' : ' — ' + res.errors.slice(0, 3).join('; ')}`)
}

console.log('\nMalformed input rejected:')
const mangled = load('catalog.analysis.json') as Record<string, any>
mangled.archetype.primary = 'banana'
delete mangled.core.catalog.families[0].skuCount
const mres = validateAnalysis(mangled)
assert(!mres.ok && mres.errors.length >= 1, `rejected with ${mres.errors.length} error(s)`)

console.log('\nfilterSchema derivation:')
const cat = validateAnalysis(load('catalog.analysis.json')).value as Analysis
const fs0 = deriveFilterSchema(cat.core.catalog!.families)
const keys = fs0.map((e) => e.key).sort()
assert(
  JSON.stringify(keys) === JSON.stringify(['capacity', 'finish', 'material', 'wallType']),
  `filter keys = [capacity, finish, material, wallType] (got [${keys.join(', ')}])`,
)
const capacity = fs0.find((e) => e.key === 'capacity')!
assert(
  capacity.type === 'numericRange' && capacity.range!.min === 30 && capacity.range!.max === 1420,
  `capacity range unions to 30..1420 ml (got ${capacity.range?.min}..${capacity.range?.max})`,
)
const material = fs0.find((e) => e.key === 'material')!
assert((material.values?.length ?? 0) >= 8, `material unions ${material.values?.length} values`)

console.log('\nEdit recomputes filters, immutably:')
const before = JSON.stringify(cat)
const edited = toggleAxisFilter(cat, 'single-wall-hot', 0) // capacity axis -> isFilter off
assert(JSON.stringify(cat) === before, 'original analysis untouched (immutability)')
const swh = edited.core.catalog!.families.find((f) => f.id === 'single-wall-hot')!
assert(swh.variantAxes[0].isFilter === false, 'single-wall-hot capacity isFilter toggled off')
const capAfter = edited.core.catalog!.filterSchema.find((e) => e.key === 'capacity')
assert(!!capAfter, 'capacity stays a filter (other families still expose it)')
assert(
  !!capAfter && !capAfter.familyIds.includes('single-wall-hot'),
  'single-wall-hot dropped from capacity familyIds',
)

console.log('\nResearch block (v0.5):')
// v0 fixtures (no research) still validate — covered above; now a well-formed research block.
const withResearch = JSON.parse(JSON.stringify(load('catalog.analysis.json'))) as any
const makeResearch = (verdict: string, recStatus: string) => ({
  industryRead: { industry: 'foodservice packaging', buyerProfile: 'ops buyers', channelNotes: 'B2B RFQ' },
  claims: [
    { id: 'c1', text: 'Faceted spec filtering speeds B2B selection.', sources: [{ title: 'Baymard', url: 'https://baymard.com/', kind: 'study' }], verdict, reviewerNote: '' },
  ],
  recommendations: [
    { id: 'r1', familyId: null, patternId: 'parametric-filtering', title: 'Enable filtering', rationale: 'Buyers shop by spec.', claimIds: ['c1'], impact: 'high', status: recStatus, wiring: { enableModules: ['sizeComparison'] } },
  ],
  exemplars: [{ name: 'McMaster-Carr', url: 'https://www.mcmaster.com/', why: 'gold standard' }],
  valuePitch: { headline: 'Sell faster', narrative: '...', topMoves: [{ move: 'Filter bar', why: 'cuts to 3 SKUs', claimIds: ['c1'] }], nextStep: 'Book a call' },
  meta: { researchedAt: '2026-06-11', modelUsed: 'mock', webSearchUsed: false, promptVersion: 'v1' },
})
withResearch.research = makeResearch('verified', 'accepted')
assert(validateAnalysis(withResearch).ok, 'analysis WITH a well-formed research block validates')

// Invariant: a refuted claim cited by an accepted rec AND the value pitch must be rejected.
const badResearch = JSON.parse(JSON.stringify(load('catalog.analysis.json'))) as any
badResearch.research = makeResearch('refuted', 'accepted')
const badRes = validateAnalysis(badResearch)
assert(
  !badRes.ok && badRes.errors.some((e) => e.includes('refuted')),
  `refuted claim in accepted rec / pitch is rejected (${badRes.errors.filter((e) => e.includes('refuted')).length} invariant errors)`,
)

console.log(failures === 0 ? '\n✅ ALL CHECKS PASSED' : `\n❌ ${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)

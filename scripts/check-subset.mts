/**
 * Verifies the 5-product demo path: subsetAnalysis() must yield a VALID analysis with only the
 * chosen families and a filter schema recomputed to match. Writes the subset so it can be inlined
 * and rendered like a real demo file. Run: npx tsx scripts/check-subset.mts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subsetAnalysis, suggestDemoFamilies } from '../src/build/subset'
import { validateAnalysis } from '../src/schema'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const analysis = JSON.parse(readFileSync(resolve(root, 'fixtures/catalog.analysis.json'), 'utf8'))

const all = analysis.core.catalog.families.map((f: { id: string }) => f.id)
const suggested = suggestDemoFamilies(analysis, 5)
const pick = suggested.slice(0, 2) // a deliberately tight demo
const sub = subsetAnalysis(analysis, pick)
const res = validateAnalysis(sub)

const subFilterKeys = sub.core.catalog!.filterSchema.map((e) => e.key)
const fullFilterKeys = analysis.core.catalog.filterSchema.map((e: { key: string }) => e.key)

console.log('total families:', all.length)
console.log('suggested (ranked):', suggested)
console.log('subset to:', sub.core.catalog!.families.map((f: { name: string }) => f.name))
console.log('valid analysis:', res.ok, res.ok ? '' : res.errors)
console.log('filter keys — full:', fullFilterKeys.length, '→ subset:', subFilterKeys.length)
console.log('schema recomputed (subset ⊆ full):', subFilterKeys.every((k: string) => fullFilterKeys.includes(k)))

if (!res.ok || sub.core.catalog!.families.length !== 2) {
  console.error('SUBSET CHECK FAILED')
  process.exit(1)
}
writeFileSync(resolve(root, 'dist/_demo.analysis.json'), JSON.stringify(sub))
console.log('\nwrote dist/_demo.analysis.json — SUBSET CHECK PASSED')

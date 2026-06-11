/**
 * Mock research dossiers — the "Research presentation" button returns these with no key (§6).
 * Cloned on read so panel edits (accept/reject) never mutate the imported fixture.
 */
import type { Research } from '../schema'
import catalogResearch from '../../fixtures/catalog.research.json'
import configuratorResearch from '../../fixtures/configurator.research.json'

/** Configurator catalogues get the tooling dossier; catalog/hybrid get the packaging one. */
export function getResearchFixture(archetypePrimary: string): Research {
  const src = archetypePrimary === 'configurator' ? configuratorResearch : catalogResearch
  return structuredClone(src) as unknown as Research
}

/**
 * Mock fixtures — make the whole UI exercisable with no API key (§6). The imported JSON is cloned
 * on every read so panel edits never mutate the module-level fixture.
 */
import type { Analysis } from '../schema'
import catalogFixture from '../../fixtures/catalog.analysis.json'
import configuratorFixture from '../../fixtures/configurator.analysis.json'

export type FixtureKey = 'catalog' | 'configurator'

export const FIXTURE_LABELS: Record<FixtureKey, string> = {
  catalog: 'Catalog · Verdant Pack',
  configurator: 'Configurator · Meridian Toolform',
}

const FIXTURES: Record<FixtureKey, Analysis> = {
  catalog: catalogFixture as unknown as Analysis,
  configurator: configuratorFixture as unknown as Analysis,
}

export function getFixture(key: FixtureKey): Analysis {
  return structuredClone(FIXTURES[key])
}

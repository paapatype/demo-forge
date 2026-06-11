/**
 * Browser-side entry to the brain. Three paths, in priority order:
 *   1. A runtime API key is set (Settings) → call Anthropic DIRECTLY from the browser. This is the
 *      static / GitHub Pages path, and also works locally.
 *   2. Env mock (VITE_MOCK=1) → return a fixture (no key, no network) for keyless dev.
 *   3. Otherwise → POST to the local proxy (the server build).
 * Either way the result is validated against the schema before it reaches the store.
 */
import type { Analysis } from '../schema'
import { validateAnalysis } from '../schema'
import { API_ANALYZE, PDF_MAX_BYTES } from '../config'
import { getApiKey } from '../settings/apiKey'
import { getFixture, type FixtureKey } from './mock'
import { analyzePdfDirect } from './directAnalyze'
import {
  AnalyzeError,
  PIPELINE_STAGES,
  delay,
  type AnalyzeErrorKind,
  type AnalyzeStage,
} from './analyzeTypes'

export { AnalyzeError, PIPELINE_STAGES }
export type { AnalyzeErrorKind, AnalyzeStage }

/** Env-flag mock: the dropzone itself returns a fixture. The top-bar dev switch works regardless. */
export const IS_MOCK = import.meta.env.VITE_MOCK === '1'

export interface AnalyzeOptions {
  onStage?: (stage: AnalyzeStage, index: number) => void
  /** Which fixture mock mode returns (defaults to catalog). */
  mockFixture?: FixtureKey
  signal?: AbortSignal
}

/** Load a fixture directly (used by the dev fixture switch), validated. */
export function loadFixture(key: FixtureKey): Analysis {
  const result = validateAnalysis(getFixture(key))
  if (!result.ok) {
    throw new AnalyzeError(`Fixture "${key}" failed validation: ${result.errors[0]}`, 'malformed')
  }
  return result.value!
}

export async function analyze(file: File | null, opts: AnalyzeOptions = {}): Promise<Analysis> {
  // 1. Runtime key → browser-direct (static / Pages, and local with a key).
  if (getApiKey()) {
    if (!file) throw new AnalyzeError('No PDF provided.', 'server')
    return analyzePdfDirect(file, opts)
  }

  // 2. Env mock → fixture, no key/network.
  if (IS_MOCK) {
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      opts.onStage?.(PIPELINE_STAGES[i], i)
      await delay(380, opts.signal)
    }
    return loadFixture(opts.mockFixture ?? 'catalog')
  }

  // 3. Local proxy.
  if (!file) throw new AnalyzeError('No PDF provided.', 'server')
  if (file.size > PDF_MAX_BYTES) {
    throw new AnalyzeError(
      `PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — over the ${PDF_MAX_BYTES / 1024 / 1024} MB limit.`,
      'oversized',
    )
  }

  opts.onStage?.(PIPELINE_STAGES[0], 0)
  const form = new FormData()
  form.append('pdf', file)

  let resp: Response
  try {
    resp = await fetch(API_ANALYZE, { method: 'POST', body: form, signal: opts.signal })
  } catch {
    // No proxy reachable and no key set — on the hosted build, that means "add your key".
    throw new AnalyzeError(
      'Add your Anthropic API key in Settings to analyze PDFs (or run the local server).',
      'nokey',
    )
  }

  if (!resp.ok) {
    const data = (await resp.json().catch(() => ({}))) as { error?: string; kind?: AnalyzeErrorKind }
    throw new AnalyzeError(data.error ?? `Server error (${resp.status}).`, data.kind ?? 'server')
  }

  const data = await resp.json()
  const result = validateAnalysis(data)
  if (!result.ok) {
    throw new AnalyzeError(`Returned analysis failed validation: ${result.errors[0]}`, 'malformed')
  }
  return result.value!
}

/**
 * Shared analyze types/constants — kept separate so both the proxy client and the browser-direct
 * client can import them without a circular dependency. Re-exported from client.ts for callers.
 */
export type AnalyzeErrorKind =
  | 'oversized'
  | 'scanned'
  | 'malformed'
  | 'network'
  | 'server'
  | 'nokey'

export class AnalyzeError extends Error {
  kind: AnalyzeErrorKind
  constructor(message: string, kind: AnalyzeErrorKind = 'server') {
    super(message)
    this.name = 'AnalyzeError'
    this.kind = kind
  }
}

export interface AnalyzeStage {
  id: string
  label: string
}

/** Staged loading states that mirror the §5 pipeline order. */
export const PIPELINE_STAGES: AnalyzeStage[] = [
  { id: 'flavor', label: 'Reading the PDF…' },
  { id: 'archetype', label: 'Detecting archetype…' },
  { id: 'sections', label: 'Classifying sections…' },
  { id: 'extract', label: 'Extracting families…' },
  { id: 'filters', label: 'Inferring filters…' },
  { id: 'finalize', label: 'Finalizing analysis…' },
]

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

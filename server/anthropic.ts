import Anthropic from '@anthropic-ai/sdk'

/**
 * Lazy SDK client: the key is read server-side only, and only when an analysis is requested —
 * so library endpoints (and the whole mock-mode app) work with no key at all.
 */
let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new AnalyzeHttpError(
      500,
      'server',
      'ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example) to run real analyses — mock mode needs no key.',
    )
  }
  if (!client) client = new Anthropic({ apiKey: key })
  return client
}

export type AnalyzeErrorKind = 'oversized' | 'scanned' | 'malformed' | 'network' | 'server'

/** Error with an HTTP status + client-facing kind; index.ts maps it to the JSON envelope. */
export class AnalyzeHttpError extends Error {
  status: number
  kind: AnalyzeErrorKind
  constructor(status: number, kind: AnalyzeErrorKind, message: string) {
    super(message)
    this.name = 'AnalyzeHttpError'
    this.status = status
    this.kind = kind
  }
}

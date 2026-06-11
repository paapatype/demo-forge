/**
 * Shared, framework-free configuration. Imported by BOTH the client and the server, so it must not
 * touch import.meta / Vite env (client-only env lives in src/brain/client.ts).
 *
 * MODEL is the one-line model swap (§2). Use the strongest vision-capable Claude model.
 */

/** Strongest vision-capable model. Swap to 'claude-sonnet-4-6' for cheaper/faster analysis. */
export const MODEL = 'claude-opus-4-8'

/** Anthropic accepts PDFs up to ~32 MB / 100 pages. Guard before sending. */
export const PDF_MAX_BYTES = 32 * 1024 * 1024

export const API_ANALYZE = '/api/analyze'
export const API_LIBRARY = '/api/library'
export const API_RESEARCH = '/api/research'

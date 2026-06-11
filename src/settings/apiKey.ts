/**
 * The operator's Anthropic API key — entered at runtime and stored ONLY in this browser's
 * localStorage. It is never committed, never sent to any server of ours, and never baked into the
 * static build. On a static (GitHub Pages) deployment this is the sole place the key lives, and the
 * browser calls Anthropic directly with it.
 */
const STORAGE_KEY = 'demo-forge:anthropic-key'

export function getApiKey(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && v.trim() ? v.trim() : null
  } catch {
    return null
  }
}

export function setApiKey(key: string): void {
  try {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage blocked (private mode) — analysis just won't be available */
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function hasApiKey(): boolean {
  return getApiKey() !== null
}

/** A masked preview for the settings UI, e.g. "sk-ant-…last4". Never log the full key. */
export function maskedKey(): string | null {
  const k = getApiKey()
  if (!k) return null
  const tail = k.slice(-4)
  return `${k.slice(0, 7)}…${tail}`
}

/**
 * Detects whether Demo Forge is running against the LOCAL server (the proxy that holds the
 * Anthropic key in .env). When it is, the UI can analyze real PDFs with NO key in the browser and
 * should drop the "add your key" nag. On the static GitHub Pages build /api/health isn't reachable,
 * so this resolves to unreachable and the browser-key path takes over. Probed once, module-cached.
 */
import { useEffect, useState } from 'react'

export interface ServerStatus {
  /** The local proxy answered — we're running locally, not on static hosting. */
  reachable: boolean
  /** The proxy has ANTHROPIC_API_KEY set, so real analysis needs no browser key. */
  keyLoaded: boolean
}

let cache: ServerStatus | null = null
let inflight: Promise<ServerStatus> | null = null

async function probe(): Promise<ServerStatus> {
  try {
    const r = await fetch('/api/health', { method: 'GET' })
    if (!r.ok) return { reachable: false, keyLoaded: false }
    const d = (await r.json()) as { keyLoaded?: boolean }
    return { reachable: true, keyLoaded: !!d.keyLoaded }
  } catch {
    return { reachable: false, keyLoaded: false }
  }
}

/** True once we know the local server is up AND holds the key. */
export function useServerKeyActive(): boolean {
  const [status, setStatus] = useState<ServerStatus | null>(cache)
  useEffect(() => {
    if (cache) {
      setStatus(cache)
      return
    }
    inflight ??= probe().then((s) => {
      cache = s
      return s
    })
    let active = true
    inflight.then((s) => {
      if (active) setStatus(s)
    })
    return () => {
      active = false
    }
  }, [])
  return !!status?.reachable && !!status?.keyLoaded
}

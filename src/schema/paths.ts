/**
 * Pure utilities for confidenceFlags[].path — e.g. "core.catalog.families[2].variantAxes[1]".
 * The panel resolves a flag's subject with resolvePath and links to it via a stable DOM id
 * (renderer elements carry data-path); the actual scroll lives in client code, not here, so this
 * module stays DOM-free and importable by the server.
 */

export type PathToken = string | number

export function parsePath(path: string): PathToken[] {
  const tokens: PathToken[] = []
  for (const part of path.split('.')) {
    const re = /([^[\]]+)|\[(\d+)\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(part)) !== null) {
      if (m[1] !== undefined) tokens.push(m[1])
      else if (m[2] !== undefined) tokens.push(Number(m[2]))
    }
  }
  return tokens
}

export function resolvePath(root: unknown, path: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = root
  for (const tok of parsePath(path)) {
    if (cur == null) return undefined
    cur = cur[tok]
  }
  return cur
}

/**
 * Scroll the preview to the element a confidenceFlag's path refers to. Renderer elements carry
 * data-path attributes (e.g. a family card has data-path="core.catalog.families[3]"); we match the
 * LONGEST prefix of the flag path that exists in the DOM, scroll it into view, and pulse it.
 * Returns false when nothing matched (caller may clear filters and retry — the target family
 * could be filtered out of the grid).
 */
import { parsePath } from '../../schema'

export function scrollToPath(path: string): boolean {
  const tokens = parsePath(path)
  const parts: string[] = []
  for (const t of tokens) {
    if (typeof t === 'number' && parts.length > 0) parts[parts.length - 1] += `[${t}]`
    else parts.push(String(t))
  }

  for (let i = parts.length; i > 0; i--) {
    const prefix = parts.slice(0, i).join('.')
    const el = document.querySelector(`[data-path="${prefix}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.remove('flag-flash')
      void el.offsetWidth // restart the animation if it was already applied
      el.classList.add('flag-flash')
      window.setTimeout(() => el.classList.remove('flag-flash'), 2600)
      return true
    }
  }
  return false
}

/**
 * Build a self-contained catalogue HTML in the browser — no server. It fetches the deployed public
 * viewer (viewer.html + its built JS/CSS, same-origin), inlines them into one file, and embeds the
 * corrected analysis as window.__ANALYSIS__. The result opens anywhere — host it or email it. Fonts
 * load from a CDN <link> (the viewer has no local font files), so the file stays small and styled.
 */
import type { Analysis } from '../schema'

const escapeForScript = (s: string): string => s.replace(/<\/(script)/gi, '<\\/$1')

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Could not fetch ${url} (${r.status}). Build a deployed/previewed app, not the dev server.`)
  return r.text()
}

export async function buildStandalone(analysis: Analysis): Promise<string> {
  const viewerUrl = new URL('viewer.html', document.baseURI).href
  const html = await fetchText(viewerUrl)
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // The module is about to be inlined — drop its preload hints.
  doc.querySelectorAll('link[rel="modulepreload"]').forEach((l) => l.remove())

  // Inline local stylesheets; leave CDN font links as <link>.
  for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))) {
    const href = link.getAttribute('href')
    if (!href || /^https?:/i.test(href)) continue
    const css = await fetchText(new URL(href, viewerUrl).href)
    const style = doc.createElement('style')
    style.textContent = css
    link.replaceWith(style)
  }

  // Inline local module scripts.
  for (const script of Array.from(doc.querySelectorAll('script[src]'))) {
    const src = script.getAttribute('src')
    if (!src || /^https?:/i.test(src)) continue
    const js = await fetchText(new URL(src, viewerUrl).href)
    const inline = doc.createElement('script')
    inline.type = script.getAttribute('type') || 'module'
    inline.textContent = escapeForScript(js)
    script.replaceWith(inline)
  }

  // Embed the catalogue. A regular <script> at the top of <head> runs during parse, before the
  // deferred module reads window.__ANALYSIS__.
  const data = doc.createElement('script')
  data.textContent = `window.__ANALYSIS__ = ${escapeForScript(JSON.stringify(analysis))};`
  doc.head.insertBefore(data, doc.head.firstChild)
  doc.title = `${analysis.meta.client} — Catalogue`

  return '<!doctype html>\n' + doc.documentElement.outerHTML
}

export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

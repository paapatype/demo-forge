/**
 * Node mirror of src/build/buildStandalone.ts — proves the in-browser inliner against the REAL
 * built dist/ output without a browser, and doubles as a CLI:
 *
 *   node scripts/inline-standalone.mjs [analysis.json] [out.html]
 *
 * With no args it self-tests using fixtures/catalog.analysis.json and asserts the result is fully
 * self-contained (JS + CSS inlined, analysis embedded, no leftover ./assets refs).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const escapeForScript = (s) => s.replace(/<\/(script)/gi, '<\\/$1')

export function inlineStandalone(analysis) {
  const distDir = resolve(root, 'dist')
  const viewerHtml = resolve(distDir, 'viewer.html')
  if (!existsSync(viewerHtml)) {
    throw new Error('dist/viewer.html missing — run `npm run build` first.')
  }
  let html = readFileSync(viewerHtml, 'utf8')

  // Drop modulepreload hints (single-file build has none, but be safe).
  html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>\s*/gi, '')

  // Inline local stylesheets; leave CDN font links alone.
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, (tag) => {
    const href = (tag.match(/href="([^"]+)"/i) || [])[1]
    if (!href || /^https?:/i.test(href)) return tag
    const css = readFileSync(resolve(distDir, href.replace(/^\.\//, '')), 'utf8')
    return `<style>${css}</style>`
  })

  // Inline local module scripts.
  html = html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/gi, (tag, src) => {
    if (/^https?:/i.test(src)) return tag
    const js = readFileSync(resolve(distDir, src.replace(/^\.\//, '')), 'utf8')
    return `<script type="module">${escapeForScript(js)}</script>`
  })

  // Embed the catalogue at the top of <head> (runs before the deferred module).
  const data = `<script>window.__ANALYSIS__ = ${escapeForScript(JSON.stringify(analysis))};</script>`
  html = html.replace(/<head>/i, `<head>\n    ${data}`)

  return html
}

// ---- CLI / self-test ----
const [, , analysisArg, outArg] = process.argv
const analysisPath = analysisArg
  ? resolve(process.cwd(), analysisArg)
  : resolve(root, 'fixtures/catalog.analysis.json')
const analysis = JSON.parse(readFileSync(analysisPath, 'utf8'))

if (analysisArg) {
  const out = outArg ? resolve(process.cwd(), outArg) : resolve(root, 'dist/standalone.html')
  writeFileSync(out, inlineStandalone(analysis))
  console.log(`Wrote ${out}`)
} else {
  // Self-test: inject a </script> sentinel to exercise the escaper.
  const probe = structuredClone(analysis)
  probe.meta = { ...probe.meta, client: 'Acme </script><script>alert(1)</script>' }
  const html = inlineStandalone(probe)
  writeFileSync(resolve(root, 'dist/standalone-test.html'), html)

  const checks = [
    ['analysis embedded', html.includes('window.__ANALYSIS__ =')],
    ['JS inlined (no ./assets script src)', !/<script[^>]*src="\.\/assets/i.test(html)],
    ['CSS inlined (no ./assets stylesheet)', !/<link[^>]*href="\.\/assets/i.test(html)],
    ['<style> present', html.includes('<style>')],
    ['no leftover ./assets refs', !/\.\/assets\//.test(html)],
    ['fonts CDN link kept', html.includes('fonts.googleapis.com')],
    ['</script> in data escaped', !/alert\(1\)<\/script>/.test(html) && html.includes('<\\/script>')],
    ['inlined module is real JS (not /src/ or .tsx)', !/\/src\/|\.tsx/.test(html)],
  ]
  let ok = true
  for (const [name, pass] of checks) {
    console.log(`${pass ? '✓' : '✗'} ${name}`)
    if (!pass) ok = false
  }
  const kb = Math.round(Buffer.byteLength(html) / 1024)
  console.log(`\nstandalone size: ${kb} kB`)
  if (!ok) {
    console.error('\nSELF-TEST FAILED')
    process.exit(1)
  }
  console.log('SELF-TEST PASSED')
}

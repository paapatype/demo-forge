/**
 * Public catalogue viewer — the entry that a self-contained build runs. It reads the corrected
 * analysis from window.__ANALYSIS__ (embedded at build time), loads it into the store, and renders
 * the catalogue with NO review tooling. Deliberately does not import @fontsource (fonts come from
 * the CDN <link> in viewer.html) so the built CSS has no local font URLs and inlines cleanly.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import '../styles/tokens.css'
import '../styles/base.css'
import { validateAnalysis } from '../schema'
import { useAnalysisStore } from '../store/useAnalysisStore'
import ViewerApp from './ViewerApp'

declare global {
  interface Window {
    __ANALYSIS__?: unknown
  }
}

const raw = window.__ANALYSIS__
const result = raw
  ? validateAnalysis(raw)
  : { ok: false as const, errors: ['No catalogue data was embedded in this file.'] }

const loaded = result.ok && result.value !== undefined
if (loaded) {
  useAnalysisStore.getState().loadAnalysis(result.value!)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {loaded ? (
      <ViewerApp />
    ) : (
      <div className="grid min-h-screen place-items-center bg-cream px-8 text-center">
        <p className="font-sans text-sm text-charcoal-muted">
          Could not load this catalogue: {result.errors[0]}
        </p>
      </div>
    )}
  </React.StrictMode>,
)

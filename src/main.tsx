import React from 'react'
import ReactDOM from 'react-dom/client'

// Fonts — self-hosted via @fontsource (no external CDN calls).
import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

// Tokens first (defines :root vars), then base styles that consume them.
import './styles/tokens.css'
import './styles/base.css'

import App from './App'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useAnalysisStore } from './store/useAnalysisStore'

// Dev-only hook: expose the store for console poking / scripted verification. Stripped in prod.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useAnalysisStore }).__store = useAnalysisStore
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

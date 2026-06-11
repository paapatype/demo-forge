import { useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { LibraryError, saveToLibrary } from '../../library/libraryClient'
import { Check, Download } from '../common/icons'

type SaveState = 'idle' | 'saving' | 'saved' | 'offline'

/**
 * Approve & Build — the export gate (§8 + Phase 11). Downloads the corrected analysis JSON (the
 * downstream contract), copies on demand, and files {analysis.json, source.pdf} into the local
 * library. If the proxy is off, it degrades to download-only and says so.
 */
export default function ApproveBuild() {
  const analysis = useAnalysisStore((s) => s.analysis)
  const sourceFile = useAnalysisStore((s) => s.sourceFile)
  const [copied, setCopied] = useState(false)
  const [save, setSave] = useState<SaveState>('idle')
  if (!analysis) return null

  const json = () => JSON.stringify(analysis, null, 2)

  const download = () => {
    const blob = new Blob([json()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.meta.slug || 'analysis'}.analysis.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — download still works */
    }
  }

  const approve = async () => {
    setSave('saving')
    download()
    try {
      await saveToLibrary(analysis, sourceFile)
      setSave('saved')
    } catch (e) {
      setSave(e instanceof LibraryError && e.offline ? 'offline' : 'offline')
    }
    setTimeout(() => setSave('idle'), 2600)
  }

  const label =
    save === 'saving'
      ? 'Saving…'
      : save === 'saved'
        ? 'Saved to library'
        : save === 'offline'
          ? 'Downloaded · library offline'
          : 'Approve & Build'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 ia-btn-quiet"
      >
        {copied ? <Check size={15} /> : null}
        {copied ? 'Copied' : 'Copy JSON'}
      </button>
      <button
        type="button"
        onClick={approve}
        disabled={save === 'saving'}
        className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 font-sans text-sm font-medium tracking-wide shadow-sm transition-all duration-200 ease-out active:scale-[0.98] ${
          save === 'saved'
            ? 'bg-status-good text-cream'
            : save === 'offline'
              ? 'bg-status-warn text-cream'
              : 'bg-charcoal text-cream hover:bg-charcoal-light'
        }`}
      >
        {save === 'saved' ? <Check size={15} /> : <Download size={15} />}
        {label}
      </button>
    </div>
  )
}

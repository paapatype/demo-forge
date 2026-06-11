import { useEffect, useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import {
  LibraryError,
  listLibrary,
  loadFromLibrary,
  type LibraryEntry,
} from '../../library/libraryClient'
import { Archive, Close } from '../common/icons'

/**
 * The local library — every catalogue ever approved, reopenable forever (Phase 11). Lists
 * library/<slug>/ entries from the proxy; clicking one loads its analysis back into the store.
 */
export default function LibraryDrawer() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const loadAnalysis = useAnalysisStore((s) => s.loadAnalysis)

  useEffect(() => {
    if (!open) return
    setEntries(null)
    setError(null)
    listLibrary()
      .then(setEntries)
      .catch((e) => setError(e instanceof LibraryError ? e.message : 'Could not load the library.'))
  }, [open])

  const reopen = async (slug: string) => {
    setBusySlug(slug)
    try {
      loadAnalysis(await loadFromLibrary(slug))
      setOpen(false)
    } catch (e) {
      setError(e instanceof LibraryError ? e.message : 'Could not load that entry.')
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 ia-btn-quiet"
      >
        <Archive size={15} />
        Library
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in justify-end bg-charcoal/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-full max-w-md animate-slide-in-right overflow-y-auto bg-cream shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-300 bg-cream/95 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="font-serif text-xl text-charcoal">Library</h2>
                <p className="font-mono text-[11px] text-charcoal-faint">
                  every approved catalogue, kept locally
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-charcoal hover:bg-cream-200"
              >
                <Close size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <p className="rounded-md border border-status-warn/40 bg-status-warn/10 px-3 py-2.5 font-sans text-xs leading-relaxed text-charcoal">
                  {error}
                </p>
              )}
              {!error && entries === null && (
                <div className="flex items-center gap-2 py-6 font-mono text-xs text-charcoal-muted">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cream-300 border-t-charcoal" />
                  Loading…
                </div>
              )}
              {entries !== null && entries.length === 0 && (
                <div className="py-10 text-center">
                  <Archive size={26} className="mx-auto text-charcoal-faint" />
                  <p className="mt-3 font-serif text-base text-charcoal">Nothing saved yet</p>
                  <p className="mt-1 font-sans text-xs text-charcoal-muted">
                    Approve &amp; Build files each catalogue here.
                  </p>
                </div>
              )}
              {entries !== null && entries.length > 0 && (
                <div className="space-y-2">
                  {entries.map((e) => (
                    <button
                      key={e.slug}
                      type="button"
                      onClick={() => reopen(e.slug)}
                      disabled={busySlug !== null}
                      className="w-full ia-card p-3.5 text-left shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:shadow"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-serif text-base text-charcoal">
                          {e.client}
                        </span>
                        <span className="shrink-0 rounded-full bg-charcoal px-2 py-0.5 font-mono text-[10px] text-cream">
                          {e.archetype}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-charcoal-muted">
                        {e.slug} · {e.pageCount} pp
                        {e.familyCount > 0 ? ` · ${e.familyCount} families` : ''}
                        {e.hasPdf ? ' · PDF kept' : ''}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-charcoal-faint">
                        {busySlug === e.slug
                          ? 'Opening…'
                          : new Date(e.savedAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

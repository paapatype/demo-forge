/**
 * The library — every approved catalogue, kept in the browser via IndexedDB so it survives reloads
 * and works on a static (GitHub Pages) deployment with no server. One record per slug holds the
 * summary entry, the full corrected analysis, and (optionally) the source PDF blob.
 *
 * Same exported surface as the old proxy client, so ApproveBuild / LibraryDrawer are unchanged.
 */
import { validateAnalysis } from '../schema'
import type { Analysis } from '../schema'
import type { LibraryEntry } from './types'

export type { LibraryEntry }

export class LibraryError extends Error {
  offline: boolean
  constructor(message: string, offline = false) {
    super(message)
    this.name = 'LibraryError'
    this.offline = offline
  }
}

const DB_NAME = 'demo-forge'
const STORE = 'catalogues'
const VERSION = 1

interface Record {
  slug: string
  entry: LibraryEntry
  analysis: Analysis
  pdf?: Blob
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, VERSION)
    } catch {
      return reject(new LibraryError('Browser storage is unavailable here.', true))
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slug' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(new LibraryError('Could not open the library database.', true))
  })
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(new LibraryError('Library operation failed.'))
        tx.oncomplete = () => db.close()
      }),
  )
}

const safeSlug = (slug: string): string =>
  /^[a-z0-9-]{1,80}$/.test(slug) ? slug : 'catalogue'

export async function saveToLibrary(analysis: Analysis, pdf: File | null): Promise<LibraryEntry> {
  const slug = safeSlug(analysis.meta.slug)
  const entry: LibraryEntry = {
    slug,
    client: analysis.meta.client,
    archetype: analysis.archetype.primary,
    savedAt: new Date().toISOString(),
    sourceFile: analysis.meta.sourceFile,
    pageCount: analysis.meta.pageCount,
    familyCount: analysis.core.catalog?.families.length ?? 0,
    hasPdf: !!pdf,
  }
  const record: Record = { slug, entry, analysis, ...(pdf ? { pdf } : {}) }
  await run('readwrite', (store) => store.put(record))
  return entry
}

export async function listLibrary(): Promise<LibraryEntry[]> {
  const records = await run<Record[]>('readonly', (store) => store.getAll())
  return records.map((r) => r.entry).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export async function loadFromLibrary(slug: string): Promise<Analysis> {
  const record = await run<Record | undefined>('readonly', (store) => store.get(safeSlug(slug)))
  if (!record) throw new LibraryError('Not found in the library.')
  const result = validateAnalysis(record.analysis)
  if (!result.ok) throw new LibraryError(`Saved analysis failed validation: ${result.errors[0]}`)
  return result.value!
}

export async function deleteFromLibrary(slug: string): Promise<void> {
  await run('readwrite', (store) => store.delete(safeSlug(slug)))
}

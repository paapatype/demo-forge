/**
 * The local disk library — the "keep it forever" store. One folder per catalogue under library/:
 *   library/<slug>/analysis.json   the (corrected) analysis — the downstream contract
 *   library/<slug>/source.pdf      the client's original PDF, when available
 *   library/<slug>/entry.json      small summary for fast listing
 * Plain files on the operator's machine: no DB, no cloud, survives everything. (Vercel seam: this
 * module is the storage boundary — a hosted deployment would swap fs for blob storage.)
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateAnalysis } from '../src/schema'
import type { Analysis } from '../src/schema'
import type { LibraryEntry } from '../src/library/types'

export type { LibraryEntry }

const LIB_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'library')

const safeSlug = (slug: string): string | null =>
  /^[a-z0-9-]{1,80}$/.test(slug) ? slug : null

export async function saveEntry(analysis: Analysis, pdf?: Buffer): Promise<LibraryEntry> {
  const slug = safeSlug(analysis.meta.slug)
  if (!slug) throw new Error(`Bad slug "${analysis.meta.slug}" — expected kebab-case.`)

  const dir = path.join(LIB_DIR, slug)
  await fs.mkdir(dir, { recursive: true })

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

  await fs.writeFile(path.join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2))
  if (pdf) await fs.writeFile(path.join(dir, 'source.pdf'), pdf)
  else {
    // Keep hasPdf truthful for re-saves that arrive without the PDF (e.g. reopened entries).
    entry.hasPdf = await fs
      .access(path.join(dir, 'source.pdf'))
      .then(() => true)
      .catch(() => false)
  }
  await fs.writeFile(path.join(dir, 'entry.json'), JSON.stringify(entry, null, 2))
  return entry
}

export async function listEntries(): Promise<LibraryEntry[]> {
  let names: string[]
  try {
    names = await fs.readdir(LIB_DIR)
  } catch {
    return []
  }
  const entries: LibraryEntry[] = []
  for (const name of names) {
    try {
      const raw = await fs.readFile(path.join(LIB_DIR, name, 'entry.json'), 'utf8')
      entries.push(JSON.parse(raw) as LibraryEntry)
    } catch {
      // not an entry folder (e.g. .gitkeep) — skip
    }
  }
  return entries.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export async function loadEntry(slug: string): Promise<Analysis | null> {
  const safe = safeSlug(slug)
  if (!safe) return null
  let raw: string
  try {
    raw = await fs.readFile(path.join(LIB_DIR, safe, 'analysis.json'), 'utf8')
  } catch {
    return null
  }
  const result = validateAnalysis(JSON.parse(raw))
  return result.ok ? result.value! : null
}

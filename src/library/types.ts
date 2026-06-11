/**
 * Library types shared by the browser client and the server. Lives in src/ (node-free) so the app
 * typecheck never reaches into server/* (which uses node:fs/Buffer and isn't in the app's program).
 */
export interface LibraryEntry {
  slug: string
  client: string
  archetype: string
  savedAt: string
  sourceFile: string
  pageCount: number
  familyCount: number
  hasPdf: boolean
}

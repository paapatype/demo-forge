/**
 * Demo Forge proxy — the local Express shell around the pure modules:
 *   POST /api/analyze        PDF (multipart "pdf") → validated Analysis JSON   (analyze.ts)
 *   GET  /api/library        list saved catalogues                             (library.ts)
 *   GET  /api/library/:slug  load one saved analysis
 *   POST /api/library        save analysis (+ optional source PDF)
 *
 * The API key lives here, server-side only. Dev: Vite proxies /api → :3001 (same-origin).
 * Vercel seam: each route body maps onto a serverless function; analyze.ts/library.ts are the
 * portable parts, this file is the local shell.
 */
import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import { PDF_MAX_BYTES } from '../src/config'
import { validateAnalysis } from '../src/schema'
import { AnalyzeHttpError } from './anthropic'
import { analyzePdf } from './analyze'
import { listEntries, loadEntry, saveEntry } from './library'

const app = express()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: PDF_MAX_BYTES } })

app.post('/api/analyze', upload.single('pdf'), async (req, res) => {
  try {
    const file = req.file
    if (!file) throw new AnalyzeHttpError(400, 'server', 'No PDF uploaded (field "pdf").')
    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')
    if (!isPdf) throw new AnalyzeHttpError(400, 'server', 'That file is not a PDF.')

    const analysis = await analyzePdf(file.buffer, file.originalname)
    res.json(analysis)
  } catch (e) {
    sendError(res, e)
  }
})

app.get('/api/library', async (_req, res) => {
  res.json(await listEntries())
})

app.get('/api/library/:slug', async (req, res) => {
  const analysis = await loadEntry(req.params.slug)
  if (!analysis) res.status(404).json({ error: 'Not found in the library.', kind: 'server' })
  else res.json(analysis)
})

app.post('/api/library', upload.single('pdf'), async (req, res) => {
  try {
    const raw = (req.body as { analysis?: string }).analysis
    if (!raw) throw new AnalyzeHttpError(400, 'server', 'Missing "analysis" field.')
    const result = validateAnalysis(JSON.parse(raw))
    if (!result.ok) {
      throw new AnalyzeHttpError(400, 'malformed', `Analysis failed validation: ${result.errors[0]}`)
    }
    const entry = await saveEntry(result.value!, req.file?.buffer)
    res.json(entry)
  } catch (e) {
    sendError(res, e)
  }
})

app.use('/api', (_req, res) => res.status(404).json({ error: 'No such endpoint.', kind: 'server' }))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  sendError(res, err)
})

function sendError(res: express.Response, e: unknown): void {
  if (e instanceof AnalyzeHttpError) {
    res.status(e.status).json({ error: e.message, kind: e.kind })
  } else if (e instanceof multer.MulterError && e.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: `PDF exceeds the ${PDF_MAX_BYTES / 1024 / 1024} MB limit.`,
      kind: 'oversized',
    })
  } else {
    console.error('[demo-forge]', e)
    res.status(500).json({ error: (e as Error).message ?? 'Unknown server error.', kind: 'server' })
  }
}

// PROXY_PORT, not PORT — dev tooling (and Vite) commandeer PORT for the client; the proxy needs
// its own so Vite's /api → :3001 target stays correct.
const port = Number(process.env.PROXY_PORT ?? 3001)
app.listen(port, () => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  console.log(
    `[demo-forge] proxy on http://localhost:${port} — key ${hasKey ? 'loaded' : 'MISSING (mock mode still works; library works)'}`,
  )
})

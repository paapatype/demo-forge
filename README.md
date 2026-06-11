# Demo Forge

Internal, single-user tool for **IndexArch**: drop in a manufacturer PDF, get an editable, branded,
interactive web catalogue, review and correct the analysis, then **Approve & Build** — which
exports the corrected JSON (the contract a fuller downstream build consumes) and files everything
in your permanent local library. Runs on your machine; clients never touch it.

Pipeline: **classify first, extract second, render third.** Claude detects the catalogue archetype
(`catalog` = pick-from-SKUs · `configurator` = specify-a-requirement · `hybrid`), extracts families
/ spec axes / filters / units / flags into one schema-validated JSON object, and the app renders it
live with a review panel for corrections.

## Setup

```bash
npm install
cp .env.example .env
```

## Two run modes

| Mode | .env | What happens |
|---|---|---|
| **Mock** (default) | `VITE_MOCK=1`, no key needed | The dropzone/demo buttons load realistic fixtures. The entire UI — renderer, review panel, theming, export, library — works offline. |
| **Real** | `VITE_MOCK=0` + `ANTHROPIC_API_KEY=sk-ant-…` | Dropping a PDF calls `POST /api/analyze`: the proxy base64-encodes it into a Messages API `document` block, validates the returned JSON against the schema (one corrective retry), and renders it. |

Get a key at console.anthropic.com → paste into `.env` → restart `npm run dev`. The key stays
server-side; the browser never sees it. Model: `MODEL` in [src/config.ts](src/config.ts)
(one-line swap, e.g. to `claude-sonnet-4-6` for cheaper runs).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Client (Vite, :5174) + proxy (:3001) together — the normal way |
| `npm run client` / `npm run server` | Either half alone |
| `npm run typecheck` | TypeScript check (app + server) |
| `npx tsx scripts/check-schema.ts` | Schema/store logic checks |
| `npm run build` | Production client build |

## The library (keep everything forever)

**Approve & Build** downloads the corrected JSON *and* saves
`library/<client-slug>/{analysis.json, source.pdf, entry.json}` on disk. The **Library** button in
the top bar lists every saved catalogue; click one to reopen and re-edit it. Plain local files —
no database, no cloud, gitignored. If the proxy isn't running, export degrades to download-only
and says so.

## Layout

```
src/brain/      versioned analysis prompt (ANALYSIS_PROMPT_V1) + client analyze() + mock
src/schema/     TypeScript types + validator + filter derivation (single source of truth)
src/store/      Zustand working-analysis store + edit actions
src/components/ catalogue renderer · unified review panel · configurator stub · export/library
src/styles/     IndexArch design tokens (sampled from indexarch.com) + base styles
server/         Express proxy: /api/analyze + /api/library (key server-side; Vercel-ready seams)
fixtures/       catalog + configurator sample analyses (mock mode)
library/        your saved catalogues (local, gitignored)
docs/plans/     design doc · implementation plan · research-engine prompt (v0.5)
```

## Deliberate v0 seams (deferred, not forgotten)

Full guided configurator renderer · OCR for scanned PDFs (clean notice today) · real CAD→3D
(model-viewer slot + tier field only) · standalone site generation (the exported JSON is the
contract) · private hosted URL (server modules are Vercel-serverless-shaped) · merchandising
research engine (see `docs/plans/2026-06-06-research-engine-prompt.md`).

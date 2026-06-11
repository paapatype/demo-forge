# Demo Forge v0 — Design

_Date: 2026-06-05 · Status: approved, building_

## What it is

An **internal, single-user, local-first** web tool for **IndexArch**. A client emails a static
manufacturer PDF catalogue; the operator (one person) drops it into Demo Forge, which sends it to
the Claude API. Claude **classifies the catalogue's archetype, then extracts its structure**,
returning one structured JSON object (the §4 schema). The app renders that JSON as a live,
interactive, branded web catalogue, with a unified right-hand panel to **review and correct** the
analysis and **adjust presentation**. On **Approve & Build**, the corrected analysis JSON is
exported — the contract a fuller downstream build consumes — and saved to a local library.

Clients never touch the app. It runs on the operator's machine.

## Core principle

**Classify first, extract second, render third.** `archetype.primary`
(`catalog | configurator | hybrid`) routes everything. `buyerAction` (pick vs. specify) is the
load-bearing classification primitive.

## Three layers, one schema

| Layer | Where | Responsibility |
|---|---|---|
| **Brain** | `src/brain/` (versioned prompt) + `server/` (proxy) | Calls Claude with the PDF, returns structured JSON. Improvable in isolation; later liftable into a Skill. |
| **Schema** | `src/schema/` (TS types + hand-rolled validator) | The single source of truth. Brain writes it, UI renders/edits it, export emits it. |
| **Hands** | `src/components/`, `src/store/` | Catalogue renderer, unified right panel, theming, export. |

Theming is **data, not code**: `--brand-*` CSS variables are set at runtime from `analysis.brand`.
The IndexArch chrome stays constant; only product presentation picks up the client's colours. The
chrome is **sampled from indexarch.com** (the official styling): warm sand `#faf8f5`, ink `#1a1a1a`,
white cards, warm rules `#e0d8ce`, restrained terracotta-red `#b5402a` accent; fonts Libre
Baskerville / DM Sans / **JetBrains Mono** (their official mono — supersedes the spec's DM Mono).

## Resolved decisions

| Decision | Choice | Why |
|---|---|---|
| State | **Zustand** | Minimal boilerplate for the dozens of path-based panel edits; tight selector-driven re-renders. |
| Schema validation | **Hand-rolled TS validator** in `src/schema/` | No new dep; stays in lockstep with the §4 types. |
| Model | `MODEL = 'claude-opus-4-8'` in `src/config.ts` | Strongest vision-capable model; one-line change. `claude-sonnet-4-6` noted inline as the cost/speed swap. |
| PDF transport | Client uploads file (multipart) → proxy size-guards (~32 MB) + base64-encodes → Messages API `document` block | Matches §5 data flow; memory-efficient vs giant base64 JSON. Scanned → graceful "needs OCR" notice. |
| Dev CORS | **None** — Vite dev server proxies `/api` → proxy | Dev is same-origin; maps cleanly to a Vercel function later. |
| Mock mode | `VITE_MOCK=1` **and** a top-bar dev switch (catalog / configurator fixture) | Entire UI exercisable with no API key. |
| **Persistence** | **Local disk library** | On Approve & Build the proxy saves analysis JSON + source PDF to `library/`; the app lists/reopens past catalogues. Server-side files (not browser storage) — honours §12, keeps work forever. Library endpoints need no key, so they work in mock mode; degrade gracefully if the server is down. |
| Hosting | **Local**, and may also run as a **private hosted URL** | Single-user internal tool. Vercel-serverless seam kept clean so the proxy deploys to a private host whenever wanted; dev stays same-origin. |

## Dependencies (the "ask before adding" gate — approved)

- **Client runtime:** react, react-dom, zustand, @google/model-viewer, @fontsource/{libre-baskerville, dm-sans, dm-mono}
- **Server runtime:** express, @anthropic-ai/sdk, dotenv, multer
- **Dev:** vite, @vitejs/plugin-react, typescript, @types/*, tailwindcss, postcss, autoprefixer, tsx, concurrently

Implied-but-not-named, approved: `multer` (PDF upload), `tsx` (run `server/index.ts`),
`concurrently` (one-command dev), `@fontsource/*` (self-host fonts), `@google/model-viewer`.
No `cors` (Vite proxy handles dev).

## Folder structure

```
src/{brain,schema,components,store,styles,config.ts}
server/      fixtures/      library/      docs/plans/
```

## Build order (verify each before continuing)

1. Scaffold (Vite+React+TS+Tailwind, structure, `.env.example`, `npm run dev`)
2. Design system (`tokens.css`, `base.css`, fonts, Tailwind→tokens) + style sample
3. Schema + types + validator
4. Fixtures (catalog + configurator) + mock toggle
5. Zustand store + edit actions + `filterSchema` derivation
6. Catalog renderer (grid, derived filter bar, detail + modules, quote cart)
7. Unified right panel (all §8 sections, edits live, flags by `path`)
8. Configurator stub (read-only spec-axes/capabilities/library)
9. Theming (runtime `--brand-*` + logo)
10. Brain + proxy (`analysisPrompt.ts`, `POST /api/analyze`, real PDF→JSON) — wired, live test left to operator
11. Export + local library (Approve & Build → download/copy + save to `library/`)
12. Polish (loading/empty/error states, hover/scroll feel)

### Milestone check-ins
1. Scaffold → store (phases 1–5): first visual proof
2. Catalog renderer visible (phase 6)
3. Right panel + configurator stub + theming (phases 7–9)
4. Brain + proxy wired + export/library + polish (phases 10–12)

## Deferred (scaffold the seam, don't build) — §11

Full guided configurator renderer · multi-tenant hosting · OCR for scanned PDFs · real CAD→3D /
parametric 3D (model-viewer slot only) · standalone deployable site generation (export the JSON
contract). Architect for the 20th catalogue, ship the 1st.

## Acceptance (v0 works when…) — §14

Real PDF → structured analysis with correct archetype + human-readable evidence; catalog yields
families/SKU/variant-axes/filter-schema/image-inventory/per-family module+3D reads; brochure yields
spec-axes + capabilities without mistaking trademarks for products (flag present); analysis renders
as an editable review the operator corrects; catalogue looks dramatically better than a PDF;
Approve & Build exports the corrected JSON; theming is a data change; whole UI exercisable in mock
mode with no key; deferred seams stay clean.

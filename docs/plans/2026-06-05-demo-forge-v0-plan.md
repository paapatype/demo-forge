# Demo Forge v0 — Implementation Plan

> **Build map + progress tracker.** Steps use checkbox (`- [ ]`) syntax. Verification per phase
> is type-check (`tsc --noEmit`) + live render in mock mode, with focused logic checks where noted.
> Companion to the approved design: `docs/plans/2026-06-05-demo-forge-v0-design.md`.

**Goal:** A local, single-user tool that turns a manufacturer PDF into an editable, branded,
interactive web catalogue and exports the corrected analysis JSON.

**Architecture:** Three layers joined by one schema — Brain (`src/brain/` + `server/`), Schema
(`src/schema/`, single source of truth), Hands (`src/components/` + `src/store/`). `archetype.primary`
routes the renderer. Theming is runtime CSS-var data. Mock-first via fixtures.

**Tech Stack:** Vite + React + TS + Tailwind, Zustand, Express + @anthropic-ai/sdk, multer, tsx,
@google/model-viewer, @fontsource.

**Status (2026-06-11): v0 COMPLETE — all 12 phases built and verified (Milestones 1–4).** Scaffold,
IndexArch design system (sampled from indexarch.com), schema+validator, fixtures+mock, store,
catalog renderer, review panel, configurator stub, theming, versioned brain prompt + Express proxy
(/api/analyze, validated, retry-once, clean error envelopes), Approve & Build → disk library +
reopen drawer, polish. Dev: `npm run dev` → client :5174 + proxy :3001 (PROXY_PORT, not PORT). Real
analysis needs `ANTHROPIC_API_KEY` in .env + `VITE_MOCK=0`; everything else works keyless in mock.
Next (separate prompt): the merchandising research engine — docs/plans/2026-06-06-research-engine-prompt.md.

---

## File structure (decomposition locked here)

```
root/
  package.json  vite.config.ts  tsconfig.json  tsconfig.node.json
  tailwind.config.js  postcss.config.js  index.html  .env.example  README.md
  src/
    main.tsx  App.tsx  config.ts
    styles/      tokens.css  base.css
    schema/      types.ts  validate.ts  derive.ts  paths.ts  units.ts  index.ts
    brain/       analysisPrompt.ts  client.ts  mock.ts
    store/       useAnalysisStore.ts  edits.ts  selectors.ts
    theme/       applyBrand.ts
    library/     libraryClient.ts
    components/
      layout/    TopBar.tsx  AppLayout.tsx  BrandRoot.tsx
      common/    ImageWithFallback.tsx  Chip.tsx  RangeSlider.tsx  Toggle.tsx  EditableText.tsx
                 EmptyState.tsx  ErrorState.tsx  LoadingPipeline.tsx  Dropzone.tsx  StyleSample.tsx
      catalog/   CatalogView.tsx  FilterBar.tsx  FamilyGrid.tsx  FamilyCard.tsx  FamilyDetail.tsx
                 QuoteCart.tsx
                 modules/  SwatchSwitch.tsx  SizeComparison.tsx  Rich2DZoom.tsx
                           ContextVisualizer.tsx  ThreeDSpin.tsx
      configurator/ ConfiguratorView.tsx
      panel/     ReviewPanel.tsx
                 sections/ ArchetypeSection.tsx  ConfidenceFlagsSection.tsx
                           FamiliesFiltersSection.tsx  VisualControlsSection.tsx  ThemingSection.tsx
      export/    ApproveBuild.tsx  LibraryDrawer.tsx
  server/        index.ts  analyze.ts  library.ts  anthropic.ts
  fixtures/      catalog.analysis.json  configurator.analysis.json
  library/       (.gitkeep — runtime outputs, gitignored)
```

---

## Phase 1 — Scaffold  ·  _Milestone 1_

- [ ] `package.json` — scripts: `dev` (concurrently: vite + server), `client`, `server` (tsx watch), `build`, `preview`, `typecheck` (`tsc --noEmit`).
- [ ] `vite.config.ts` — React plugin; `server.proxy['/api'] → http://localhost:3001`.
- [ ] `tsconfig.json` + `tsconfig.node.json`; `postcss.config.js`; `index.html`; `src/main.tsx`; minimal `src/App.tsx`.
- [ ] `.env.example` (`ANTHROPIC_API_KEY=`, `PORT=3001`, `VITE_MOCK=1`); `README.md` (run instructions).
- [ ] `npm install` all approved deps.
- [ ] **Verify:** `npm run typecheck` clean; `npm run client` serves a blank App at localhost:5173.

## Phase 2 — Design system  ·  _Milestone 1_

- [ ] `src/styles/tokens.css` — IndexArch chrome (`--color-cream/terracotta/charcoal` + tints), brand tokens (`--brand-primary/secondary/accent`), 8px spacing scale, type scale, radii, shadows.
- [ ] `src/styles/base.css` — `@tailwind` directives, @fontsource imports (Libre Baskerville / DM Sans / DM Mono), base element + reduced-motion styles.
- [ ] `tailwind.config.js` — map `theme.extend.colors/fontFamily/spacing` to the CSS vars (no hardcoded values in components).
- [ ] `src/components/common/StyleSample.tsx` — headings/body/mono + palette swatches; render temporarily in App.
- [ ] **Verify:** sample shows correct fonts/colours/spacing; remove from App once confirmed.

## Phase 3 — Schema + types + validator  ·  _Milestone 1_

- [ ] `src/schema/types.ts` — every §4 type + enums (`Analysis` root; Meta, Brand, Archetype, Viability, TrustSignal, About, CatalogCore, Family, ImageRef, VariantAxis, ConfiguratorCore, SpecAxis, Capability, TechLibItem, Cart, ConfidenceFlag).
- [ ] `src/schema/validate.ts` — `validateAnalysis(obj): { ok, value?, errors[] }`; discriminates on `archetype.primary`; asserts catalog/configurator cores present as required.
- [ ] `src/schema/derive.ts` — `deriveFilterSchema(family)` = variantAxes where `isFilter && !isIdentifier`.
- [ ] `src/schema/units.ts` — unit display/normalization helpers (handles oz/ml/in/mm, GSM sums).
- [ ] `src/schema/paths.ts` — `resolvePath(analysis, path)` for `confidenceFlags[].path` → value + a DOM `data-path` convention for scroll-to.
- [ ] `src/schema/index.ts` — barrel.
- [ ] **Verify (logic check):** a throwaway `tsx` script asserts both fixtures validate `ok:true` and a mangled copy returns errors; `deriveFilterSchema` returns expected axes. (Reuse fixtures from Phase 4 — order Phase 4 alongside.)

## Phase 4 — Fixtures + mock mode  ·  _Milestone 1_

- [ ] `fixtures/catalog.analysis.json` — paper-cup packaging: ~12 families, mixed units (oz/ml/in/mm, one GSM sum), swatch + sizeComparison modules, multi-line quote cart, no 3D, realistic confidenceFlags, derived filterSchema.
- [ ] `fixtures/configurator.analysis.json` — industrial tooling brochure: specAxes (size range / thread form / material / target part), capabilities, technicalLibrary, trademarked thread-forms excluded + flagged, single-spec quote.
- [ ] `src/config.ts` — `MODEL='claude-opus-4-8'`, `MOCK = import.meta.env.VITE_MOCK === '1'`, size limits, api base.
- [ ] `src/brain/mock.ts` — returns a fixture by key; `src/brain/client.ts` — `analyze(file)` → mock (if MOCK) with staged loading callbacks, else POST `/api/analyze`.
- [ ] **Verify:** validator script (Phase 3) passes on both fixtures.

## Phase 5 — Store  ·  _Milestone 1_

- [ ] `src/store/edits.ts` — pure immutable updaters (renameFamily, editDescription, toggleIsFilter, toggleIsIdentifier, renameAxisLabel, setUnit/NormalizedUnit, setAxisValues/Range, setModuleEnabled, setThreeD, overrideArchetype, dismissFlag, setBrandColor, setLogo). Each recomputes `family.filterSchema`/core filterSchema where relevant.
- [ ] `src/store/useAnalysisStore.ts` — Zustand: `analysis`, `status` (idle/loading/loaded/error), `loadingStage`, UI state (selectedFamilyId, activeFilters, cart, panelSection), `setAnalysis`, edit actions delegating to `edits.ts`, `runAnalyze(file)`.
- [ ] `src/store/selectors.ts` — `selectFilteredFamilies` (apply activeFilters over filterSchema), `selectActiveFilterSchema`.
- [ ] **Verify (logic check):** tsx script — load catalog fixture into edits, toggle an axis `isFilter`, assert filterSchema recomputes; assert immutability (new refs).

## Phase 6 — Catalog renderer  ·  _Milestone 2_

- [ ] `src/components/layout/AppLayout.tsx` + `TopBar.tsx` (client name, Dropzone/re-analyze, fixture switch in dev, Approve & Build slot) + `App.tsx` switches on `archetype.primary`.
- [ ] `common/`: `Dropzone.tsx`, `LoadingPipeline.tsx` (staged: Detecting archetype → Extracting families → Inferring filters), `ImageWithFallback.tsx`, `Chip.tsx`, `RangeSlider.tsx`, `EmptyState.tsx`, `ErrorState.tsx`.
- [ ] `catalog/FilterBar.tsx` — categorical → multi-select chips, numeric/dimension → range sliders (normalized units); live filters grid; instant feel.
- [ ] `catalog/FamilyGrid.tsx` + `FamilyCard.tsx` (name Libre Baskerville, specs DM Mono, SKU count, variant summary, image/placeholder).
- [ ] `catalog/FamilyDetail.tsx` — drawer with enabled modules: `SwatchSwitch`, `SizeComparison`, `Rich2DZoom` (always), `ContextVisualizer`, `ThreeDSpin` (lazy `<model-viewer>`, only if `threeD.warranted`, degrade to 2D).
- [ ] `catalog/QuoteCart.tsx` — multi-line add families/variants, quantities, Request Quote (stub).
- [ ] **Verify:** catalog fixture renders; filtering is instant; detail modules + fallbacks work; cart adds/removes. **← Milestone 2 check-in.**

## Phase 7 — Unified right panel  ·  _Milestone 3_

- [ ] `panel/ReviewPanel.tsx` — fixed scrollable container, sectioned.
- [ ] `sections/ArchetypeSection.tsx` — primary/confidence/buyerAction/evidence; archetype override dropdown; viability read.
- [ ] `sections/ConfidenceFlagsSection.tsx` — list by severity; scroll-to element via `path`; dismiss/resolve.
- [ ] `sections/FamiliesFiltersSection.tsx` — **most legible part**: per family rename/desc/specs; per axis toggle isFilter/isIdentifier, rename label, fix unit/normalizedUnit, edit values/range; recompute filterSchema live.
- [ ] `sections/VisualControlsSection.tsx` — per family modules on/off, swatches, size-comparison toggle, card/detail sizing, 3D toggle + tier, image replace/flag.
- [ ] `common/Toggle.tsx`, `EditableText.tsx`.
- [ ] **Verify:** every edit live-updates the preview; flags scroll to their target.

## Phase 8 — Configurator stub  ·  _Milestone 3_

- [ ] `configurator/ConfiguratorView.tsx` — read-only specAxes + capabilities + technicalLibrary + viability; labeled "preview"; single-spec quote-request stub. Same `core.configurator` shape the full template will consume.
- [ ] **Verify:** configurator fixture renders cleanly; hybrid shows catalog + configurator preview alongside.

## Phase 9 — Theming  ·  _Milestone 3_

- [ ] `src/theme/applyBrand.ts` + `layout/BrandRoot.tsx` — set `--brand-*` on a root wrapper from `analysis.brand.colors`; render `brand.logo` in header.
- [ ] `sections/ThemingSection.tsx` — brand colour pickers + logo upload → store → live.
- [ ] **Verify:** changing brand colour/logo re-skins product presentation only; chrome unchanged; re-skin is a data change. **← Milestone 3 check-in.**

## Phase 10 — Brain + proxy  ·  _Milestone 4_

- [ ] `src/brain/analysisPrompt.ts` — `ANALYSIS_PROMPT_V1` versioned export implementing the §5 pipeline (flavor → 2-pass archetype → section classification → routed extraction → unit normalization → visual → modules/3D → viability → confidence flags); returns only the §4 JSON.
- [ ] `server/anthropic.ts` — SDK client from `ANTHROPIC_API_KEY`.
- [ ] `server/analyze.ts` — pure `analyze(pdfBuffer, filename)`: size guard, base64, Messages API `document` block with `MODEL`, strip fences, JSON.parse, validate (reuse `src/schema/validate.ts`), retry-once on malformed; Vercel-mappable.
- [ ] `server/index.ts` — Express; `POST /api/analyze` (multer memoryStorage) → `analyze`; clean error envelopes (oversized, malformed, API error).
- [ ] **Verify:** wired and type-clean. Live PDF→JSON test left to operator with a real key (mock-first build). **← present at Milestone 4.**

## Phase 11 — Export + local library  ·  _Milestone 4_

- [ ] `server/library.ts` — save `{analysis.json, source.pdf}` under `library/<slug>/`; list; load by slug.
- [ ] `server/index.ts` — `GET /api/library`, `GET /api/library/:slug`, `POST /api/library`.
- [ ] `src/library/libraryClient.ts` — browser client (list/load/save), graceful degrade if server down.
- [ ] `export/ApproveBuild.tsx` — download JSON + copy-to-clipboard + POST to library.
- [ ] `export/LibraryDrawer.tsx` — list past catalogues, reopen into store.
- [ ] **Verify:** Approve & Build downloads + copies + saves; library lists/reopens; works in mock mode (no key); degrades if server off.

## Phase 12 — Polish  ·  _Milestone 4_

- [ ] Loading/empty/error states across flows; subtle scroll reveals + physical hover states (anytype/spacelab feel); transitions; reduced-motion respected.
- [ ] `README.md` finalize; remove any dead scaffolding; final `npm run typecheck` + `npm run build`.
- [ ] **Verify:** full mock-mode walkthrough hits all §14 acceptance criteria. **← Milestone 4 check-in.**

---

## Deferred seams (do not build — §11)
Full guided configurator · multi-tenant/auth · OCR · real CAD→3D / parametric · standalone site
generation. Keep interfaces clean so each drops in later.

## Optional, not in v0 (clean adds if you want them later)
Test runner (vitest) for the pure-logic modules · a private hosted deploy (Vercel seam is ready).

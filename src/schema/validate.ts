/**
 * Hand-rolled structural validator for the §4 schema. No external dependency — stays in lockstep
 * with types.ts. Checks the load-bearing contract (enough to catch a malformed brain response or
 * corrupt JSON), collecting human-readable errors with paths. On success returns the typed object.
 *
 * Discriminator rule: catalog|hybrid must carry core.catalog; configurator|hybrid must carry
 * core.configurator.
 */
import {
  ARCHETYPES,
  AXIS_TYPES,
  BUYER_ACTIONS,
  CLAIM_VERDICTS,
  COMPLEXITIES,
  EXPERIENCE_MODULES,
  FITS,
  FLAVORS,
  IMAGE_QUALITIES,
  QUESTION_PRIORITIES,
  QUESTION_THEMES,
  REC_IMPACTS,
  REC_STATUSES,
  SEVERITIES,
  SOURCE_KINDS,
  SPEC_INPUT_KINDS,
  THREE_D_TIERS,
  TRUST_TYPES,
  type Analysis,
} from './types'

export interface ValidationResult {
  ok: boolean
  value?: Analysis
  errors: string[]
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function validateAnalysis(input: unknown): ValidationResult {
  const errors: string[] = []
  const E = (path: string, msg: string) => errors.push(`${path}: ${msg}`)

  const str = (v: unknown, p: string): boolean => {
    if (typeof v !== 'string') return (E(p, 'expected string'), false)
    return true
  }
  const num = (v: unknown, p: string): boolean => {
    if (typeof v !== 'number' || Number.isNaN(v)) return (E(p, 'expected number'), false)
    return true
  }
  const bool = (v: unknown, p: string): boolean => {
    if (typeof v !== 'boolean') return (E(p, 'expected boolean'), false)
    return true
  }
  const unit01 = (v: unknown, p: string): boolean => {
    if (!num(v, p)) return false
    if ((v as number) < 0 || (v as number) > 1) return (E(p, 'expected 0..1'), false)
    return true
  }
  const oneOf = (v: unknown, p: string, set: readonly string[]): boolean => {
    if (typeof v !== 'string' || !set.includes(v))
      return (E(p, `expected one of [${set.join(', ')}]`), false)
    return true
  }
  const strOrNull = (v: unknown, p: string): boolean =>
    v === null ? true : str(v, p)
  const arr = (v: unknown, p: string): v is unknown[] => {
    if (!Array.isArray(v)) return (E(p, 'expected array'), false)
    return true
  }
  const strArray = (v: unknown, p: string): boolean => {
    if (!arr(v, p)) return false
    v.forEach((x, i) => str(x, `${p}[${i}]`))
    return true
  }
  const range = (v: unknown, p: string): boolean => {
    if (v === null) return true
    if (!isObj(v)) return (E(p, 'expected {min,max} or null'), false)
    num(v.min, `${p}.min`)
    num(v.max, `${p}.max`)
    return true
  }

  if (!isObj(input)) {
    return { ok: false, errors: ['root: expected an object'] }
  }
  const a = input

  // ── meta ──
  if (isObj(a.meta)) {
    const m = a.meta
    str(m.client, 'meta.client')
    str(m.slug, 'meta.slug')
    str(m.sourceFile, 'meta.sourceFile')
    num(m.pageCount, 'meta.pageCount')
    oneOf(m.flavor, 'meta.flavor', FLAVORS)
    str(m.generatedAt, 'meta.generatedAt')
    str(m.modelUsed, 'meta.modelUsed')
  } else E('meta', 'expected object')

  // ── brand ──
  if (isObj(a.brand)) {
    strOrNull(a.brand.logo, 'brand.logo')
    if (isObj(a.brand.colors)) {
      str(a.brand.colors.primary, 'brand.colors.primary')
      str(a.brand.colors.secondary, 'brand.colors.secondary')
      str(a.brand.colors.accent, 'brand.colors.accent')
    } else E('brand.colors', 'expected object')
    strOrNull(a.brand.fontOverride, 'brand.fontOverride')
  } else E('brand', 'expected object')

  // ── archetype ──
  let primary = ''
  if (isObj(a.archetype)) {
    const ar = a.archetype
    if (oneOf(ar.primary, 'archetype.primary', ARCHETYPES)) primary = ar.primary as string
    unit01(ar.confidence, 'archetype.confidence')
    oneOf(ar.buyerAction, 'archetype.buyerAction', BUYER_ACTIONS)
    strArray(ar.evidence, 'archetype.evidence')
    if (ar.secondary !== null) {
      if (isObj(ar.secondary)) {
        oneOf(ar.secondary.type, 'archetype.secondary.type', ['catalog', 'configurator'])
        unit01(ar.secondary.confidence, 'archetype.secondary.confidence')
      } else E('archetype.secondary', 'expected object or null')
    }
  } else E('archetype', 'expected object')

  // ── viability ──
  if (isObj(a.viability)) {
    oneOf(a.viability.fitForCatalog, 'viability.fitForCatalog', FITS)
    oneOf(a.viability.fitForConfigurator, 'viability.fitForConfigurator', FITS)
    oneOf(a.viability.buildComplexity, 'viability.buildComplexity', COMPLEXITIES)
    str(a.viability.notes, 'viability.notes')
  } else E('viability', 'expected object')

  // ── trustSignals ──
  if (arr(a.trustSignals, 'trustSignals')) {
    a.trustSignals.forEach((t, i) => {
      const p = `trustSignals[${i}]`
      if (!isObj(t)) return E(p, 'expected object')
      oneOf(t.type, `${p}.type`, TRUST_TYPES)
      str(t.label, `${p}.label`)
      bool(t.couldBeFilter, `${p}.couldBeFilter`)
    })
  }

  // ── about ──
  if (isObj(a.about)) strOrNull(a.about.blurb, 'about.blurb')
  else E('about', 'expected object')

  // ── core (discriminated) ──
  if (isObj(a.core)) {
    const needCatalog = primary === 'catalog' || primary === 'hybrid'
    const needConfigurator = primary === 'configurator' || primary === 'hybrid'

    if (needCatalog) {
      if (isObj(a.core.catalog)) validateCatalog(a.core.catalog, 'core.catalog')
      else E('core.catalog', `required for archetype "${primary}"`)
    }
    if (needConfigurator) {
      if (isObj(a.core.configurator))
        validateConfigurator(a.core.configurator, 'core.configurator')
      else E('core.configurator', `required for archetype "${primary}"`)
    }
  } else E('core', 'expected object')

  // ── confidenceFlags ──
  if (arr(a.confidenceFlags, 'confidenceFlags')) {
    a.confidenceFlags.forEach((f, i) => {
      const p = `confidenceFlags[${i}]`
      if (!isObj(f)) return E(p, 'expected object')
      str(f.path, `${p}.path`)
      str(f.message, `${p}.message`)
      oneOf(f.severity, `${p}.severity`, SEVERITIES)
    })
  }

  // ── research (v0.5, optional) ──
  if (a.research !== undefined) validateResearch(a.research, 'research')

  // ── clientQuestions (v0.6, optional) ──
  if (a.clientQuestions !== undefined && arr(a.clientQuestions, 'clientQuestions')) {
    a.clientQuestions.forEach((q, i) => {
      const p = `clientQuestions[${i}]`
      if (!isObj(q)) return E(p, 'expected object')
      str(q.id, `${p}.id`)
      oneOf(q.theme, `${p}.theme`, QUESTION_THEMES)
      str(q.question, `${p}.question`)
      str(q.why, `${p}.why`)
      oneOf(q.priority, `${p}.priority`, QUESTION_PRIORITIES)
    })
  }

  function validateResearch(r: unknown, base: string) {
    if (!isObj(r)) return E(base, 'expected object')

    if (isObj(r.industryRead)) {
      str(r.industryRead.industry, `${base}.industryRead.industry`)
      str(r.industryRead.buyerProfile, `${base}.industryRead.buyerProfile`)
      str(r.industryRead.channelNotes, `${base}.industryRead.channelNotes`)
    } else E(`${base}.industryRead`, 'expected object')

    // claims first, so the refuted set is populated before the invariant checks below.
    const refuted = new Set<string>()
    if (arr(r.claims, `${base}.claims`)) {
      r.claims.forEach((c, i) => {
        const p = `${base}.claims[${i}]`
        if (!isObj(c)) return E(p, 'expected object')
        str(c.id, `${p}.id`)
        str(c.text, `${p}.text`)
        if (arr(c.sources, `${p}.sources`)) {
          c.sources.forEach((s, j) => {
            const sp = `${p}.sources[${j}]`
            if (!isObj(s)) return E(sp, 'expected object')
            str(s.title, `${sp}.title`)
            str(s.url, `${sp}.url`)
            oneOf(s.kind, `${sp}.kind`, SOURCE_KINDS)
          })
        }
        if (oneOf(c.verdict, `${p}.verdict`, CLAIM_VERDICTS) && c.verdict === 'refuted' && typeof c.id === 'string') {
          refuted.add(c.id)
        }
        str(c.reviewerNote, `${p}.reviewerNote`)
      })
    }

    const citesRefuted = (ids: unknown, p: string, what: string) => {
      if (!Array.isArray(ids)) return
      for (const cid of ids) {
        if (typeof cid === 'string' && refuted.has(cid)) {
          E(p, `${what} cites refuted claim "${cid}" — must be stripped`)
        }
      }
    }

    if (arr(r.recommendations, `${base}.recommendations`)) {
      r.recommendations.forEach((rec, i) => {
        const p = `${base}.recommendations[${i}]`
        if (!isObj(rec)) return E(p, 'expected object')
        str(rec.id, `${p}.id`)
        strOrNull(rec.familyId, `${p}.familyId`)
        str(rec.patternId, `${p}.patternId`)
        str(rec.title, `${p}.title`)
        str(rec.rationale, `${p}.rationale`)
        strArray(rec.claimIds, `${p}.claimIds`)
        oneOf(rec.impact, `${p}.impact`, REC_IMPACTS)
        const statusOk = oneOf(rec.status, `${p}.status`, REC_STATUSES)
        if (isObj(rec.wiring)) {
          if (arr(rec.wiring.enableModules, `${p}.wiring.enableModules`)) {
            rec.wiring.enableModules.forEach((m, j) =>
              oneOf(m, `${p}.wiring.enableModules[${j}]`, EXPERIENCE_MODULES),
            )
          }
        } else E(`${p}.wiring`, 'expected object')
        if (statusOk && rec.status === 'accepted') {
          citesRefuted(rec.claimIds, `${p}.claimIds`, 'accepted recommendation')
        }
      })
    }

    if (arr(r.exemplars, `${base}.exemplars`)) {
      r.exemplars.forEach((ex, i) => {
        const p = `${base}.exemplars[${i}]`
        if (!isObj(ex)) return E(p, 'expected object')
        str(ex.name, `${p}.name`)
        str(ex.url, `${p}.url`)
        str(ex.why, `${p}.why`)
      })
    }

    if (isObj(r.valuePitch)) {
      const vp = r.valuePitch
      str(vp.headline, `${base}.valuePitch.headline`)
      str(vp.narrative, `${base}.valuePitch.narrative`)
      str(vp.nextStep, `${base}.valuePitch.nextStep`)
      if (arr(vp.topMoves, `${base}.valuePitch.topMoves`)) {
        vp.topMoves.forEach((m, i) => {
          const p = `${base}.valuePitch.topMoves[${i}]`
          if (!isObj(m)) return E(p, 'expected object')
          str(m.move, `${p}.move`)
          str(m.why, `${p}.why`)
          strArray(m.claimIds, `${p}.claimIds`)
          citesRefuted(m.claimIds, `${p}.claimIds`, 'value pitch')
        })
      }
    } else E(`${base}.valuePitch`, 'expected object')

    if (isObj(r.meta)) {
      str(r.meta.researchedAt, `${base}.meta.researchedAt`)
      str(r.meta.modelUsed, `${base}.meta.modelUsed`)
      bool(r.meta.webSearchUsed, `${base}.meta.webSearchUsed`)
      str(r.meta.promptVersion, `${base}.meta.promptVersion`)
    } else E(`${base}.meta`, 'expected object')
  }

  function validateCatalog(c: Record<string, unknown>, base: string) {
    if (arr(c.families, `${base}.families`)) {
      c.families.forEach((fam, i) => validateFamily(fam, `${base}.families[${i}]`))
    }
    // filterSchema is derived; tolerate any array here (recomputed on load).
    if (c.filterSchema !== undefined) arr(c.filterSchema, `${base}.filterSchema`)
    if (isObj(c.cart)) oneOf(c.cart.type, `${base}.cart.type`, ['multiLineQuoteBuilder'])
    else E(`${base}.cart`, 'expected object')
  }

  function validateFamily(fam: unknown, p: string) {
    if (!isObj(fam)) return E(p, 'expected object')
    str(fam.id, `${p}.id`)
    str(fam.name, `${p}.name`)
    str(fam.description, `${p}.description`)
    if (arr(fam.images, `${p}.images`)) {
      fam.images.forEach((img, i) => {
        const ip = `${p}.images[${i}]`
        if (!isObj(img)) return E(ip, 'expected object')
        strOrNull(img.src, `${ip}.src`)
        bool(img.missing, `${ip}.missing`)
        oneOf(img.quality, `${ip}.quality`, IMAGE_QUALITIES)
      })
    }
    if (arr(fam.experienceModules, `${p}.experienceModules`)) {
      fam.experienceModules.forEach((m, i) =>
        oneOf(m, `${p}.experienceModules[${i}]`, EXPERIENCE_MODULES),
      )
    }
    if (isObj(fam.threeD)) {
      bool(fam.threeD.warranted, `${p}.threeD.warranted`)
      oneOf(fam.threeD.tier, `${p}.threeD.tier`, THREE_D_TIERS)
      strOrNull(fam.threeD.path, `${p}.threeD.path`)
      bool(fam.threeD.cadLikely, `${p}.threeD.cadLikely`)
    } else E(`${p}.threeD`, 'expected object')
    if (arr(fam.variantAxes, `${p}.variantAxes`)) {
      fam.variantAxes.forEach((ax, i) => validateAxis(ax, `${p}.variantAxes[${i}]`))
    }
    num(fam.skuCount, `${p}.skuCount`)
  }

  function validateAxis(ax: unknown, p: string) {
    if (!isObj(ax)) return E(p, 'expected object')
    str(ax.key, `${p}.key`)
    str(ax.label, `${p}.label`)
    oneOf(ax.type, `${p}.type`, AXIS_TYPES)
    strOrNull(ax.unit, `${p}.unit`)
    strOrNull(ax.normalizedUnit, `${p}.normalizedUnit`)
    if (ax.values !== null) strArray(ax.values, `${p}.values`)
    range(ax.range, `${p}.range`)
    bool(ax.isFilter, `${p}.isFilter`)
    bool(ax.isIdentifier, `${p}.isIdentifier`)
  }

  function validateConfigurator(c: Record<string, unknown>, base: string) {
    if (arr(c.specAxes, `${base}.specAxes`)) {
      c.specAxes.forEach((s, i) => {
        const p = `${base}.specAxes[${i}]`
        if (!isObj(s)) return E(p, 'expected object')
        str(s.key, `${p}.key`)
        str(s.label, `${p}.label`)
        oneOf(s.inputKind, `${p}.inputKind`, SPEC_INPUT_KINDS)
        oneOf(s.type, `${p}.type`, AXIS_TYPES)
        strOrNull(s.unit, `${p}.unit`)
        if (s.values !== null) strArray(s.values, `${p}.values`)
        range(s.range, `${p}.range`)
        str(s.helpText, `${p}.helpText`)
        strOrNull(s.constraints, `${p}.constraints`)
      })
    }
    if (arr(c.capabilities, `${base}.capabilities`)) {
      c.capabilities.forEach((cap, i) => {
        const p = `${base}.capabilities[${i}]`
        if (!isObj(cap)) return E(p, 'expected object')
        str(cap.title, `${p}.title`)
        str(cap.body, `${p}.body`)
      })
    }
    if (arr(c.technicalLibrary, `${base}.technicalLibrary`)) {
      c.technicalLibrary.forEach((t, i) => {
        const p = `${base}.technicalLibrary[${i}]`
        if (!isObj(t)) return E(p, 'expected object')
        str(t.name, `${p}.name`)
        str(t.kind, `${p}.kind`)
        str(t.note, `${p}.note`)
      })
    }
    if (isObj(c.cart)) oneOf(c.cart.type, `${base}.cart.type`, ['singleSpecQuoteRequest'])
    else E(`${base}.cart`, 'expected object')
  }

  return errors.length === 0
    ? { ok: true, value: input as unknown as Analysis, errors: [] }
    : { ok: false, errors }
}

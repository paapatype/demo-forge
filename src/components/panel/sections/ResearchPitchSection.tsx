import { useState } from 'react'
import { useAnalysisStore } from '../../../store/useAnalysisStore'
import { RESEARCH_STAGES } from '../../../research/researchClient'
import type { ClaimVerdict, RecImpact, ResearchClaim, ResearchRecommendation } from '../../../schema'
import { Check, Sparkle } from '../../common/icons'

const VERDICT_TONE: Record<ClaimVerdict, string> = {
  verified: 'text-status-good',
  plausible: 'text-status-warn',
  refuted: 'text-status-high',
  unchecked: 'text-charcoal-faint',
}
const IMPACT_TONE: Record<RecImpact, string> = {
  high: 'bg-charcoal text-cream',
  medium: 'bg-cream-200 text-charcoal',
  low: 'bg-cream-200 text-charcoal-muted',
}

function RecCard({
  rec,
  claimsById,
}: {
  rec: ResearchRecommendation
  claimsById: Map<string, ResearchClaim>
}) {
  const accept = useAnalysisStore((s) => s.acceptRecommendation)
  const reject = useAnalysisStore((s) => s.rejectRecommendation)
  const cited = rec.claimIds.map((id) => claimsById.get(id)).filter((c): c is ResearchClaim => !!c)
  const hasPlausible = cited.some((c) => c.verdict === 'plausible')
  const wires = rec.wiring.enableModules.length > 0 || !!rec.wiring.presentation

  return (
    <div className={`ia-card p-3 ${rec.status === 'rejected' ? 'opacity-55' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-xs font-medium text-charcoal">{rec.title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase ${IMPACT_TONE[rec.impact]}`}>
          {rec.impact}
        </span>
      </div>
      <p className="mt-1 font-sans text-[11px] leading-relaxed text-charcoal-muted">{rec.rationale}</p>

      <div className="mt-2 space-y-1 border-t border-cream-300 pt-2">
        {cited.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`font-mono text-[9px] uppercase ${VERDICT_TONE[c.verdict]}`}>{c.verdict}</span>
            {c.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-[11px] text-charcoal underline decoration-cream-300 underline-offset-2 hover:decoration-charcoal"
              >
                {s.title}
              </a>
            ))}
          </div>
        ))}
      </div>

      {hasPlausible && rec.status !== 'rejected' && (
        <p className="mt-2 rounded bg-status-warn/10 px-2 py-1 font-sans text-[10px] leading-snug text-charcoal">
          ⚠ Cites a plausible (not fully verified) claim — confirm before using with a client.
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        {rec.status === 'accepted' ? (
          <>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-status-good">
              <Check size={11} /> accepted{wires ? ' · wired' : ''}
            </span>
            <button
              type="button"
              onClick={() => reject(rec.id)}
              className="ml-auto font-sans text-[11px] text-charcoal-muted underline-offset-2 hover:underline"
            >
              Undo
            </button>
          </>
        ) : rec.status === 'rejected' ? (
          <button
            type="button"
            onClick={() => accept(rec.id)}
            className="ml-auto font-sans text-[11px] text-charcoal-muted underline-offset-2 hover:underline"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => accept(rec.id)}
              className="bg-charcoal px-3 py-1 font-sans text-[11px] font-medium tracking-wide text-cream transition-colors hover:bg-charcoal-light"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => reject(rec.id)}
              className="border border-cream-300 px-3 py-1 font-sans text-[11px] text-charcoal-muted transition-colors hover:bg-cream-200"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResearchPitchSection() {
  const research = useAnalysisStore((s) => s.analysis?.research)
  const status = useAnalysisStore((s) => s.researchStatus)
  const stage = useAnalysisStore((s) => s.researchStage)
  const error = useAnalysisStore((s) => s.researchError)
  const runResearch = useAnalysisStore((s) => s.runResearch)
  // Default OUTSIDE the selector — `?? []` inside it returns a fresh array each call, which trips
  // useSyncExternalStore's "getSnapshot should be cached" infinite loop (crashed the configurator,
  // which has no catalog core).
  const families = useAnalysisStore((s) => s.analysis?.core.catalog?.families) ?? []
  const [copied, setCopied] = useState(false)

  if (status === 'researching') {
    const idx = stage ? RESEARCH_STAGES.findIndex((s) => s.id === stage.id) : 0
    return (
      <ol className="space-y-1">
        {RESEARCH_STAGES.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2.5 py-1">
            <span
              className={`grid h-4 w-4 place-items-center rounded-full text-cream ${
                i < idx ? 'bg-status-good' : i === idx ? 'bg-charcoal' : 'bg-cream-300'
              }`}
            >
              {i < idx ? (
                <Check size={10} />
              ) : i === idx ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cream" />
              ) : null}
            </span>
            <span
              className={`font-sans text-xs ${
                i === idx ? 'text-charcoal' : i < idx ? 'text-charcoal-muted' : 'text-charcoal-faint'
              }`}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  if (!research) {
    return (
      <div>
        <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
          Research how this kind of product is best displayed and sold — grounded in cited e-commerce
          UX and B2B-buying evidence, every claim reviewed — and get a client-ready value pitch.
        </p>
        {status === 'error' && error && (
          <p className="mt-2 rounded-md border border-status-high/40 bg-status-high/10 px-3 py-2 font-sans text-xs text-charcoal">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => runResearch()}
          className="mt-3 inline-flex items-center gap-1.5 bg-charcoal px-4 py-2 font-sans text-sm font-medium tracking-wide text-cream shadow-sm transition-colors hover:bg-charcoal-light"
        >
          <Sparkle size={14} /> Research presentation
        </button>
      </div>
    )
  }

  const claimsById = new Map(research.claims.map((c) => [c.id, c]))
  const catalogueWide = research.recommendations.filter((r) => r.familyId === null)
  const perFamily = research.recommendations.filter((r) => r.familyId !== null)
  const familyName = (id: string | null) => families.find((f) => f.id === id)?.name ?? id ?? ''

  const copyPitch = async () => {
    const vp = research.valuePitch
    const text = [
      vp.headline,
      '',
      vp.narrative,
      '',
      ...vp.topMoves.map((m, i) => `${i + 1}. ${m.move} — ${m.why}`),
      '',
      `Next: ${vp.nextStep}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="space-y-4">
      <div className="ia-card p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Industry read
        </p>
        <p className="mt-1 font-serif text-sm text-charcoal">{research.industryRead.industry}</p>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-charcoal-muted">
          {research.industryRead.buyerProfile}
        </p>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-charcoal-muted">
          {research.industryRead.channelNotes}
        </p>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Recommendations
        </p>
        <div className="mt-2 space-y-2">
          {catalogueWide.map((rec) => (
            <RecCard key={rec.id} rec={rec} claimsById={claimsById} />
          ))}
          {perFamily.map((rec) => (
            <div key={rec.id}>
              <p className="mb-1 font-mono text-[10px] text-terracotta">→ {familyName(rec.familyId)}</p>
              <RecCard rec={rec} claimsById={claimsById} />
            </div>
          ))}
        </div>
      </div>

      <div className="ia-card p-3.5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
            Value pitch
          </p>
          <button
            type="button"
            onClick={copyPitch}
            className="inline-flex items-center gap-1 font-sans text-[11px] text-charcoal underline-offset-2 hover:underline"
          >
            {copied ? <Check size={12} /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-1.5 font-serif text-base leading-snug text-charcoal">
          {research.valuePitch.headline}
        </p>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-charcoal-muted">
          {research.valuePitch.narrative}
        </p>
        <ol className="mt-3 space-y-2">
          {research.valuePitch.topMoves.map((m, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-xs text-terracotta">{i + 1}</span>
              <div>
                <p className="font-sans text-xs font-medium text-charcoal">{m.move}</p>
                <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">{m.why}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t border-cream-300 pt-2 font-sans text-[11px] text-charcoal">
          <span className="text-charcoal-faint">Next:</span> {research.valuePitch.nextStep}
        </p>
      </div>

      <p className="font-mono text-[10px] text-charcoal-faint">
        {research.meta.webSearchUsed ? 'web-researched' : 'knowledge-base'} ·{' '}
        {research.claims.length} claims · {research.meta.modelUsed}
      </p>
    </div>
  )
}

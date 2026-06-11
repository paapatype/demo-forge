import { useAnalysisStore } from '../../../store/useAnalysisStore'
import { ARCHETYPES, type ArchetypePrimary, type Fit } from '../../../schema'

const FIT_TONE: Record<Fit, string> = {
  strong: 'text-status-good',
  medium: 'text-status-warn',
  weak: 'text-charcoal-faint',
}

export default function ArchetypeSection() {
  const archetype = useAnalysisStore((s) => s.analysis?.archetype)
  const viability = useAnalysisStore((s) => s.analysis?.viability)
  const core = useAnalysisStore((s) => s.analysis?.core)
  const overrideArchetype = useAnalysisStore((s) => s.overrideArchetype)
  if (!archetype || !viability) return null

  const confidence = Math.round(archetype.confidence * 100)
  const missingCore =
    (archetype.primary === 'catalog' && !core?.catalog) ||
    (archetype.primary === 'configurator' && !core?.configurator) ||
    (archetype.primary === 'hybrid' && (!core?.catalog || !core?.configurator))

  return (
    <div className="space-y-4">
      {/* detected archetype + confidence */}
      <div className="ia-card p-3.5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-charcoal px-2.5 py-0.5 font-mono text-xs text-cream">
            {archetype.primary}
          </span>
          <span className="font-mono text-xs text-charcoal-muted">
            buyer&nbsp;action: <span className="text-charcoal">{archetype.buyerAction}</span>
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
              confidence
            </span>
            <span className="font-mono text-xs text-charcoal">{confidence}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-cream-300">
            <div className="h-full rounded-full bg-charcoal" style={{ width: `${confidence}%` }} />
          </div>
        </div>
        {archetype.secondary && (
          <p className="mt-2.5 font-mono text-[11px] text-charcoal-muted">
            secondary read: {archetype.secondary.type} (
            {Math.round(archetype.secondary.confidence * 100)}%)
          </p>
        )}
      </div>

      {/* override */}
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Override archetype
        </span>
        <select
          value={archetype.primary}
          onChange={(e) => overrideArchetype(e.target.value as ArchetypePrimary)}
          className="mt-1 w-full rounded-md border border-cream-300 bg-surface px-2.5 py-1.5 font-sans text-sm text-charcoal"
        >
          {ARCHETYPES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      {missingCore && (
        <p className="rounded-md border border-status-warn/40 bg-status-warn/10 px-3 py-2 font-sans text-xs text-charcoal">
          The analysis has no extracted structure for this archetype — the preview will show a
          notice. Switch back, or re-analyze the PDF.
        </p>
      )}

      {/* evidence */}
      <div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Why — evidence
        </span>
        <ul className="mt-1.5 space-y-1.5">
          {archetype.evidence.map((e, i) => (
            <li key={i} className="flex gap-2 font-sans text-xs leading-relaxed text-charcoal-muted">
              <span className="mt-[7px] h-px w-2.5 shrink-0 bg-terracotta" />
              {e}
            </li>
          ))}
        </ul>
      </div>

      {/* viability */}
      <div className="ia-card p-3.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-charcoal-faint">catalog</p>
            <p className={`mt-0.5 font-mono text-xs ${FIT_TONE[viability.fitForCatalog]}`}>
              {viability.fitForCatalog}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-charcoal-faint">config.</p>
            <p className={`mt-0.5 font-mono text-xs ${FIT_TONE[viability.fitForConfigurator]}`}>
              {viability.fitForConfigurator}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-charcoal-faint">complexity</p>
            <p className="mt-0.5 font-mono text-xs text-charcoal">{viability.buildComplexity}</p>
          </div>
        </div>
        {viability.notes && (
          <p className="mt-3 border-t border-cream-300 pt-2.5 font-sans text-xs leading-relaxed text-charcoal-muted">
            {viability.notes}
          </p>
        )}
      </div>
    </div>
  )
}

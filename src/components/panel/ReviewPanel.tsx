import { useState, type ReactNode } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { ChevronDown } from '../common/icons'
import ArchetypeSection from './sections/ArchetypeSection'
import ConfidenceFlagsSection from './sections/ConfidenceFlagsSection'
import FamiliesFiltersSection from './sections/FamiliesFiltersSection'
import VisualControlsSection from './sections/VisualControlsSection'
import ThemingSection from './sections/ThemingSection'
import ResearchPitchSection from './sections/ResearchPitchSection'
import ClientQuestionsSection from './sections/ClientQuestionsSection'

function Section({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-cream-300">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
      >
        <span className="flex-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal">
          {title}
        </span>
        {badge}
        <ChevronDown
          size={14}
          className={`shrink-0 text-charcoal-faint transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  )
}

/**
 * The unified review-and-adjust panel (§8). Every edit writes to the single store object and
 * live-updates the preview; the corrected object is what Approve & Build exports.
 */
export default function ReviewPanel() {
  const hasCatalog = useAnalysisStore((s) => !!s.analysis?.core.catalog)
  const activeFlagCount = useAnalysisStore(
    (s) => s.analysis?.confidenceFlags.filter((f) => !f.dismissed).length ?? 0,
  )
  const hasHigh = useAnalysisStore(
    (s) => !!s.analysis?.confidenceFlags.some((f) => !f.dismissed && f.severity === 'high'),
  )
  const researchRecCount = useAnalysisStore((s) => s.analysis?.research?.recommendations.length ?? 0)
  const questionCount = useAnalysisStore((s) => s.analysis?.clientQuestions?.length ?? 0)

  return (
    <div className="pb-12">
      <div className="border-b border-cream-300 px-5 pb-4 pt-5">
        <p className="font-serif text-lg text-charcoal">Review &amp; adjust</p>
        <p className="mt-0.5 font-sans text-xs leading-relaxed text-charcoal-muted">
          Correct the analysis here — every change updates the preview live and lands in the
          exported JSON.
        </p>
      </div>

      <Section title="Archetype & viability">
        <ArchetypeSection />
      </Section>

      <Section
        title="Confidence flags"
        badge={
          activeFlagCount > 0 ? (
            <span
              className={`grid h-4 min-w-4 place-items-center rounded-full px-1 font-mono text-[10px] text-cream ${
                hasHigh ? 'bg-status-high' : 'bg-charcoal'
              }`}
            >
              {activeFlagCount}
            </span>
          ) : undefined
        }
      >
        <ConfidenceFlagsSection />
      </Section>

      <Section
        title="Research & pitch"
        badge={
          researchRecCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-terracotta px-1 font-mono text-[10px] text-cream">
              {researchRecCount}
            </span>
          ) : undefined
        }
      >
        <ResearchPitchSection />
      </Section>

      <Section
        title="Questions for the client"
        badge={
          questionCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-charcoal px-1 font-mono text-[10px] text-cream">
              {questionCount}
            </span>
          ) : undefined
        }
      >
        <ClientQuestionsSection />
      </Section>

      {hasCatalog && (
        <Section title="Families & filters">
          <FamiliesFiltersSection />
        </Section>
      )}

      {hasCatalog && (
        <Section title="Visual controls" defaultOpen={false}>
          <VisualControlsSection />
        </Section>
      )}

      <Section title="Theming" defaultOpen={false}>
        <ThemingSection />
      </Section>
    </div>
  )
}

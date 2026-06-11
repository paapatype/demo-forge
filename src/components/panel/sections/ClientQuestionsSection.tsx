import { useState } from 'react'
import { useAnalysisStore } from '../../../store/useAnalysisStore'
import type { QuestionPriority } from '../../../schema'
import { Check } from '../../common/icons'

const PRIORITY_TONE: Record<QuestionPriority, string> = {
  high: 'bg-charcoal text-cream',
  medium: 'bg-cream-200 text-charcoal',
  low: 'bg-cream-200 text-charcoal-muted',
}
const ORDER: Record<QuestionPriority, number> = { high: 0, medium: 1, low: 2 }

/**
 * Contextual questions to ask the client on the call (§ "give me questions…"). Generated WITH the
 * analysis and grounded in this PDF — its flags, units, and ambiguities — so they're specific, not
 * boilerplate. Sorted by priority; copy-all for pasting into a call doc / email.
 */
export default function ClientQuestionsSection() {
  // Default outside the selector (stable reference; avoids the getSnapshot loop).
  const questions = useAnalysisStore((s) => s.analysis?.clientQuestions) ?? []
  const [copied, setCopied] = useState(false)

  if (questions.length === 0) {
    return (
      <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
        No questions yet — they're generated with the analysis (and come bundled with the demo
        catalogues).
      </p>
    )
  }

  const sorted = [...questions].sort((a, b) => ORDER[a.priority] - ORDER[b.priority])

  const copyAll = async () => {
    const text = sorted
      .map((q, i) => `${i + 1}. [${q.theme}] ${q.question}\n   Why: ${q.why}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(`Questions for ${'the client'}:\n\n${text}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
          Ask these on the call to build the catalogue better — each tied to something in their PDF.
        </p>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex shrink-0 items-center gap-1 font-sans text-[11px] text-charcoal underline-offset-2 hover:underline"
        >
          {copied ? <Check size={12} /> : null}
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </div>

      {sorted.map((q) => (
        <div key={q.id} className="ia-card p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-sans text-xs font-medium leading-snug text-charcoal">{q.question}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase ${PRIORITY_TONE[q.priority]}`}
            >
              {q.priority}
            </span>
          </div>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-charcoal-muted">{q.why}</p>
          <span className="mt-1.5 inline-block font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">
            {q.theme}
          </span>
        </div>
      ))}
    </div>
  )
}

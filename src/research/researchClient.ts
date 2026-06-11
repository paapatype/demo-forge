/**
 * Browser entry to the research layer. Mock mode returns a reviewed fixture (staged for feel);
 * otherwise it POSTs the CURRENT (operator-corrected) analysis to the proxy, which runs the
 * researcher + reviewer and returns the analysis with a validated `research` block. Either way the
 * result is validated before it reaches the store, and refuted claims never survive (validator).
 */
import type { Analysis, Research } from '../schema'
import { validateAnalysis } from '../schema'
import { API_RESEARCH } from '../config'
import { IS_MOCK } from '../brain/client'
import { getResearchFixture } from './mock'

export interface ResearchStage {
  id: string
  label: string
}

/** Staged loading that mirrors the researcher → reviewer → pitch pipeline (§7). */
export const RESEARCH_STAGES: ResearchStage[] = [
  { id: 'consult', label: 'Consulting pattern library…' },
  { id: 'industry', label: 'Researching the industry…' },
  { id: 'review', label: 'Reviewing every claim…' },
  { id: 'pitch', label: 'Drafting the value pitch…' },
]

export class ResearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResearchError'
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

export interface ResearchOptions {
  onStage?: (stage: ResearchStage, index: number) => void
  signal?: AbortSignal
}

/** Validate a research block by attaching it to its analysis and running the full validator. */
function validateResearchAgainst(analysis: Analysis, research: Research): Research {
  const result = validateAnalysis({ ...analysis, research })
  if (!result.ok) {
    throw new ResearchError(`Research failed validation: ${result.errors[0]}`)
  }
  return result.value!.research!
}

export async function requestResearch(
  analysis: Analysis,
  opts: ResearchOptions = {},
): Promise<Research> {
  // Demo catalogues carry a baked, reviewed dossier — works with no key/server (incl. on Pages).
  const isDemo =
    analysis.meta.slug === 'verdant-pack' || analysis.meta.slug === 'meridian-toolform'
  if (IS_MOCK || isDemo) {
    for (let i = 0; i < RESEARCH_STAGES.length; i++) {
      opts.onStage?.(RESEARCH_STAGES[i], i)
      await delay(420, opts.signal)
    }
    return validateResearchAgainst(analysis, getResearchFixture(analysis.archetype.primary))
  }

  opts.onStage?.(RESEARCH_STAGES[0], 0)
  let resp: Response
  try {
    resp = await fetch(API_RESEARCH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ analysis }),
      signal: opts.signal,
    })
  } catch {
    throw new ResearchError(
      "Live research isn't enabled on the hosted build yet — it runs in the local app. (The demo catalogues show it in action.)",
    )
  }
  if (!resp.ok) {
    const data = (await resp.json().catch(() => ({}))) as { error?: string }
    throw new ResearchError(data.error ?? `Research failed (${resp.status}).`)
  }
  const data = (await resp.json()) as { research?: Research }
  if (!data.research) throw new ResearchError('Server returned no research block.')
  return validateResearchAgainst(analysis, data.research)
}

/**
 * Pure analysis: PDF buffer in → validated Analysis out. No Express types in here, so this maps
 * 1:1 onto a Vercel serverless function later (the seam): the HTTP shell lives in index.ts.
 */
import Anthropic from '@anthropic-ai/sdk'
import { MODEL, PDF_MAX_BYTES } from '../src/config'
import { ANALYSIS_PROMPT, ANALYSIS_PROMPT_VERSION } from '../src/brain/analysisPrompt'
import { validateAnalysis } from '../src/schema'
import type { Analysis } from '../src/schema'
import { AnalyzeHttpError, getAnthropic } from './anthropic'

const MAX_TOKENS = 16000
const ASK = 'Analyze this catalog.'

/** The model sometimes wraps JSON in fences or stray prose — cut to the outermost object. */
function extractJson(text: string): string {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) {
    throw new AnalyzeHttpError(502, 'malformed', 'The model returned no JSON object.')
  }
  return cleaned.slice(first, last + 1)
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'catalogue'
  )
}

async function callModel(pdfBase64: string, retryNote?: string): Promise<string> {
  const anthropic = getAnthropic()
  let resp: Anthropic.Message
  try {
    resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      system: ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
            },
            { type: 'text', text: retryNote ? `${ASK}\n\n${retryNote}` : ASK },
          ],
        },
      ],
    })
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      const status = e.status ?? 502
      if (status === 401) throw new AnalyzeHttpError(500, 'server', 'Invalid ANTHROPIC_API_KEY — check .env.')
      if (status === 413 || status === 400)
        throw new AnalyzeHttpError(413, 'oversized', `The API rejected the PDF (${e.message}). It may exceed the ~100-page / 32 MB document limit.`)
      if (status === 429 || status === 529)
        throw new AnalyzeHttpError(503, 'server', 'The API is rate-limited or overloaded — try again in a minute.')
      throw new AnalyzeHttpError(502, 'server', `Anthropic API error: ${e.message}`)
    }
    throw new AnalyzeHttpError(502, 'network', `Could not reach the Anthropic API: ${(e as Error).message}`)
  }

  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

export async function analyzePdf(pdf: Buffer, filename: string): Promise<Analysis> {
  if (pdf.byteLength > PDF_MAX_BYTES) {
    throw new AnalyzeHttpError(
      413,
      'oversized',
      `PDF is ${(pdf.byteLength / 1024 / 1024).toFixed(1)} MB — over the ${PDF_MAX_BYTES / 1024 / 1024} MB limit. Split or compress it.`,
    )
  }
  const b64 = pdf.toString('base64')

  // First attempt, then one corrective retry carrying the validation errors (§5).
  let lastErrors: string[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    const retryNote =
      attempt === 0
        ? undefined
        : `Your previous response was not valid against the contract. Errors:\n${lastErrors
            .slice(0, 12)
            .map((e) => `- ${e}`)
            .join('\n')}\nReturn ONLY the corrected JSON object.`
    const text = await callModel(b64, retryNote)

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJson(text))
    } catch (e) {
      lastErrors = [`JSON.parse failed: ${(e as Error).message}`]
      continue
    }

    const result = validateAnalysis(parsed)
    if (!result.ok) {
      lastErrors = result.errors
      continue
    }

    // Server-side stamps — authoritative regardless of what the model wrote.
    const analysis = result.value!
    analysis.meta.sourceFile = filename
    analysis.meta.generatedAt = new Date().toISOString()
    analysis.meta.modelUsed = `${MODEL} · prompt ${ANALYSIS_PROMPT_VERSION}`
    if (!analysis.meta.slug || !/^[a-z0-9-]+$/.test(analysis.meta.slug)) {
      analysis.meta.slug = slugify(analysis.meta.client || filename.replace(/\.pdf$/i, ''))
    }
    return analysis
  }

  throw new AnalyzeHttpError(
    502,
    'malformed',
    `The analysis came back off-contract twice. First errors: ${lastErrors.slice(0, 3).join('; ')}`,
  )
}

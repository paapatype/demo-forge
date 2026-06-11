/**
 * Browser-direct analysis — the static-deployment path. Reads the operator's key from localStorage
 * and calls the Anthropic Messages API straight from the browser (the SDK's documented browser
 * mode). Safe here because it's a single-user tool: the operator's own key, in the operator's own
 * browser. Same discipline as the proxy: document block, validate, retry once, clean errors.
 */
import Anthropic from '@anthropic-ai/sdk'
import { MODEL, PDF_MAX_BYTES } from '../config'
import { ANALYSIS_PROMPT, ANALYSIS_PROMPT_VERSION } from './analysisPrompt'
import { validateAnalysis, type Analysis } from '../schema'
import { getApiKey } from '../settings/apiKey'
import { AnalyzeError, PIPELINE_STAGES, type AnalyzeStage } from './analyzeTypes'

const MAX_TOKENS = 16000
const ASK = 'Analyze this catalog.'

function extractJson(text: string): string {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) {
    throw new AnalyzeError('The model returned no JSON object.', 'malformed')
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1)) // strip "data:application/pdf;base64,"
    }
    reader.onerror = () => reject(new AnalyzeError('Could not read the PDF file.', 'server'))
    reader.readAsDataURL(file)
  })
}

export interface DirectAnalyzeOptions {
  onStage?: (stage: AnalyzeStage, index: number) => void
  signal?: AbortSignal
}

export async function analyzePdfDirect(
  file: File,
  opts: DirectAnalyzeOptions = {},
): Promise<Analysis> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new AnalyzeError('No Anthropic API key set — add it in Settings to analyze PDFs.', 'nokey')
  }
  if (file.size > PDF_MAX_BYTES) {
    throw new AnalyzeError(
      `PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — over the ${PDF_MAX_BYTES / 1024 / 1024} MB limit.`,
      'oversized',
    )
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  opts.onStage?.(PIPELINE_STAGES[0], 0)
  const data = await fileToBase64(file)
  opts.onStage?.(PIPELINE_STAGES[1], 1)

  let lastErrors: string[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    const retryNote =
      attempt === 0
        ? undefined
        : `Your previous response was not valid against the contract. Errors:\n${lastErrors
            .slice(0, 12)
            .map((e) => `- ${e}`)
            .join('\n')}\nReturn ONLY the corrected JSON object.`

    let resp: Anthropic.Message
    try {
      resp = await client.messages.create(
        {
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
                  source: { type: 'base64', media_type: 'application/pdf', data },
                },
                { type: 'text', text: retryNote ? `${ASK}\n\n${retryNote}` : ASK },
              ],
            },
          ],
        },
        { signal: opts.signal },
      )
    } catch (e) {
      if (e instanceof Anthropic.APIError) {
        const status = e.status ?? 0
        if (status === 401)
          throw new AnalyzeError('Invalid API key — check it in Settings.', 'nokey')
        if (status === 413 || status === 400)
          throw new AnalyzeError(
            `The API rejected the PDF (${e.message}). It may exceed the ~100-page / 32 MB document limit.`,
            'oversized',
          )
        if (status === 429 || status === 529)
          throw new AnalyzeError('Anthropic is rate-limited or overloaded — try again in a minute.', 'server')
        throw new AnalyzeError(`Anthropic API error: ${e.message}`, 'server')
      }
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      throw new AnalyzeError(`Could not reach Anthropic: ${(e as Error).message}`, 'network')
    }

    opts.onStage?.(PIPELINE_STAGES[3], 3)
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

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

    const analysis = result.value!
    analysis.meta.sourceFile = file.name
    analysis.meta.generatedAt = new Date().toISOString()
    analysis.meta.modelUsed = `${MODEL} · prompt ${ANALYSIS_PROMPT_VERSION} · browser`
    if (!analysis.meta.slug || !/^[a-z0-9-]+$/.test(analysis.meta.slug)) {
      analysis.meta.slug = slugify(analysis.meta.client || file.name.replace(/\.pdf$/i, ''))
    }
    opts.onStage?.(PIPELINE_STAGES[5], 5)
    return analysis
  }

  throw new AnalyzeError(
    `The analysis came back off-contract twice. First errors: ${lastErrors.slice(0, 3).join('; ')}`,
    'malformed',
  )
}

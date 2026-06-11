/**
 * Unit display helpers. Normalization itself is the brain's job (per family — never assume
 * catalog-wide uniform units); the UI mostly displays the normalizedUnit and formats ranges.
 */

/** Prefer the normalized unit for display, fall back to the raw unit. */
export function displayUnit(unit: string | null, normalizedUnit: string | null): string {
  return (normalizedUnit ?? unit ?? '').trim()
}

/** Trim trailing zeros so 90.0 -> "90" and 12.50 -> "12.5". */
export function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace(/\.?0+$/, '')
}

/** "8–32 oz", or "90 mm" when min === max. */
export function formatRange(min: number, max: number, unit?: string | null): string {
  const u = unit ? ` ${unit}` : ''
  return min === max ? `${formatNum(min)}${u}` : `${formatNum(min)}–${formatNum(max)}${u}`
}

/**
 * GSM is sometimes stated as a sum of plies, e.g. "195+240". Returns the total, or null if not a
 * recognisable sum/number. Display code can keep the raw string and use this for sorting/filtering.
 */
export function parseGsmSum(raw: string): number | null {
  const cleaned = raw.replace(/gsm/i, '').trim()
  if (!/^[\d+\s.]+$/.test(cleaned)) return null
  const parts = cleaned.split('+').map((p) => Number(p.trim()))
  if (parts.some((n) => Number.isNaN(n))) return null
  return parts.reduce((a, b) => a + b, 0)
}

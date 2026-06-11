/** Dual-thumb range slider (two overlaid native inputs + a styled track). Thumbs can't cross. */
export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  format = String,
}: {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  format?: (n: number) => string
}) {
  const [lo, hi] = value
  const span = max - min || 1
  const pct = (n: number) => ((n - min) / span) * 100
  const setLo = (n: number) => onChange([Math.min(n, hi), hi])
  const setHi = (n: number) => onChange([lo, Math.max(n, lo)])
  // When the low thumb sits in the upper half, lift it above the high thumb so it stays grabbable.
  const loZ = lo >= (min + max) / 2 ? 5 : 3

  return (
    <div>
      <div className="dual-range relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-cream-300" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-charcoal"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => setLo(Number(e.target.value))}
          aria-label="Minimum"
          style={{ zIndex: loZ }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          aria-label="Maximum"
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-xs text-charcoal-muted">
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
    </div>
  )
}

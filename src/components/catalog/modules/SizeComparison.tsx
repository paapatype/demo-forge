import type { VariantAxis } from '../../../schema'
import { displayUnit, formatNum } from '../../../schema'

/** All sizes shown to scale (§9). Volume axes scale by cube-root; dimension axes scale linearly. */
export default function SizeComparison({ axis }: { axis: VariantAxis }) {
  if (!axis.range) return null
  const unit = displayUnit(axis.unit, axis.normalizedUnit)
  const { min, max } = axis.range
  const mid = Math.round((min + max) / 2)
  const samples = [...new Set([min, mid, max])].sort((a, b) => a - b)
  const isVolume = axis.type === 'numericRange'
  const scaleOf = (v: number) => (isVolume ? Math.cbrt(v) / Math.cbrt(max) : v / max)

  return (
    <div>
      <span className="font-mono text-[11px] uppercase tracking-wider text-charcoal-faint">
        {axis.label} · to scale
      </span>
      <div className="mt-3 flex items-end justify-around gap-4 border-b border-cream-300 pb-2">
        {samples.map((v) => {
          const s = scaleOf(v)
          return (
            <div key={v} className="flex flex-col items-center gap-2">
              <div
                className="rounded-b-md rounded-t-sm border border-brand-primary/30"
                style={{
                  height: `${36 + s * 110}px`,
                  width: `${22 + s * 44}px`,
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 26%, rgb(var(--c-surface))), color-mix(in srgb, var(--brand-secondary) 20%, rgb(var(--c-surface))))',
                }}
              />
              <span className="font-mono text-xs text-charcoal">
                {formatNum(v)}
                {unit ? ` ${unit}` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

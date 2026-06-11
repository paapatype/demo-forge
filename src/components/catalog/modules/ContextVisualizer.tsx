import type { Family } from '../../../schema'
import ImageWithFallback from '../../common/ImageWithFallback'
import { Eye } from '../../common/icons'

/** "See it in use" — places the product in a stylised context scene. */
export default function ContextVisualizer({ family }: { family: Family }) {
  return (
    <div
      className="relative flex aspect-[16/9] items-end justify-center overflow-hidden rounded-lg border border-cream-300"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--brand-secondary) 12%, rgb(var(--c-cream))), color-mix(in srgb, var(--brand-primary) 10%, rgb(var(--c-surface))))',
      }}
    >
      {/* counter surface */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: 'color-mix(in srgb, var(--brand-secondary) 22%, rgb(var(--c-surface)))' }}
      />
      <div className="relative z-10 mb-[8%] h-3/4 w-1/3 drop-shadow-md">
        <ImageWithFallback image={family.images[0]} name={family.name} className="h-full w-full" />
      </div>
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2 py-0.5 font-mono text-[10px] text-charcoal-muted backdrop-blur-sm">
        <Eye size={11} /> in context
      </span>
    </div>
  )
}

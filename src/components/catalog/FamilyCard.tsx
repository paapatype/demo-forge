import type { ExperienceModule, Family } from '../../schema'
import { displayUnit, formatRange } from '../../schema'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import ImageWithFallback from '../common/ImageWithFallback'
import { Cube, Eye, Ruler, Swatch, Zoom } from '../common/icons'

const MODULE_ICON: Record<ExperienceModule, typeof Swatch> = {
  swatchSwitch: Swatch,
  sizeComparison: Ruler,
  rich2DZoom: Zoom,
  threeDSpin: Cube,
  contextVisualizer: Eye,
}

const IMG_HEIGHT: Record<string, string> = { sm: 'h-36', md: 'h-44', lg: 'h-52' }

function axisSummary(family: Family): string[] {
  const out: string[] = []
  for (const ax of family.variantAxes) {
    if (ax.isIdentifier) continue
    if (ax.type === 'categorical' && ax.values?.length) {
      out.push(ax.values.length > 1 ? `${ax.values[0]} +${ax.values.length - 1}` : ax.values[0])
    } else if (ax.range) {
      out.push(formatRange(ax.range.min, ax.range.max, displayUnit(ax.unit, ax.normalizedUnit)))
    }
    if (out.length >= 3) break
  }
  return out
}

export default function FamilyCard({ family }: { family: Family }) {
  const select = useAnalysisStore((s) => s.setSelectedFamily)
  // Original index in the full families array — the data-path anchor flags scroll to.
  const index = useAnalysisStore(
    (s) => s.analysis?.core.catalog?.families.findIndex((f) => f.id === family.id) ?? -1,
  )
  const imgH = IMG_HEIGHT[family.presentation?.cardSize ?? 'md']
  const summary = axisSummary(family)

  return (
    <button
      type="button"
      data-path={index >= 0 ? `core.catalog.families[${index}]` : undefined}
      onClick={() => select(family.id)}
      className="group flex animate-fade-in flex-col overflow-hidden ia-card text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <ImageWithFallback
          image={family.images[0]}
          name={family.name}
          className={`w-full ${imgH}`}
          rounded="rounded-none"
        />
        <span className="absolute right-2 top-2 rounded-full bg-charcoal/80 px-2 py-0.5 font-mono text-[11px] text-cream">
          {family.skuCount} SKUs
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg leading-snug text-charcoal">{family.name}</h3>
        <p className="mt-1 line-clamp-2 font-sans text-sm text-charcoal-muted">
          {family.description}
        </p>

        {summary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {summary.map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-cream-300 bg-cream px-2 py-0.5 font-mono text-[11px] text-charcoal-muted"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-1.5 text-charcoal-faint">
            {family.experienceModules.map((m) => {
              const Icon = MODULE_ICON[m]
              return <Icon key={m} size={14} />
            })}
          </div>
          <span className="font-sans text-xs text-charcoal opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>
    </button>
  )
}

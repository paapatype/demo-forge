import { useEffect, useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { displayUnit, formatRange } from '../../schema'
import Rich2DZoom from './modules/Rich2DZoom'
import SwatchSwitch from './modules/SwatchSwitch'
import SizeComparison from './modules/SizeComparison'
import ContextVisualizer from './modules/ContextVisualizer'
import ThreeDSpin from './modules/ThreeDSpin'
import { Cart, Check, Close } from '../common/icons'

/** Family detail drawer with the experience modules the analysis enabled. Graceful fallbacks. */
export default function FamilyDetail() {
  const family = useAnalysisStore((s) => {
    const id = s.selectedFamilyId
    return id ? (s.analysis?.core.catalog?.families.find((f) => f.id === id) ?? null) : null
  })
  const close = useAnalysisStore((s) => s.setSelectedFamily)
  const addToCart = useAnalysisStore((s) => s.addToCart)

  const [selections, setSelections] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)
  const familyId = family?.id

  useEffect(() => {
    if (!family) return
    const init: Record<string, string> = {}
    for (const ax of family.variantAxes) {
      if (!ax.isIdentifier && ax.type === 'categorical' && ax.values?.length) init[ax.key] = ax.values[0]
    }
    setSelections(init)
    setAdded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId])

  if (!family) return null

  const mods = new Set(family.experienceModules)
  const swatchAxis = family.swatchAxisKey
    ? family.variantAxes.find((a) => a.key === family.swatchAxisKey)
    : undefined
  const sizeAxis = family.sizeComparisonAxisKey
    ? family.variantAxes.find((a) => a.key === family.sizeComparisonAxisKey)
    : undefined

  const showSwatch = mods.has('swatchSwitch') && !!swatchAxis?.values?.length
  const showSize = mods.has('sizeComparison') && !!sizeAxis?.range
  const showContext = mods.has('contextVisualizer')
  const show3D = mods.has('threeDSpin') && family.threeD.warranted

  const variantLabel =
    family.variantAxes
      .filter((a) => !a.isIdentifier && a.type === 'categorical' && a.values?.length)
      .map((a) => selections[a.key])
      .filter(Boolean)
      .join(' · ') || 'standard'

  const onAdd = () => {
    addToCart({ familyId: family.id, familyName: family.name, variantLabel, selections, qty: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in justify-end bg-charcoal/30"
      onClick={() => close(null)}
    >
      <div
        className="h-full w-full max-w-xl animate-slide-in-right overflow-y-auto bg-cream shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-300 bg-cream/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl text-charcoal">{family.name}</h2>
            <p className="font-mono text-xs text-charcoal-faint">{family.skuCount} SKUs</p>
          </div>
          <button
            type="button"
            onClick={() => close(null)}
            className="grid h-9 w-9 place-items-center rounded-full text-charcoal hover:bg-cream-200"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="space-y-7 px-6 py-6">
          {show3D ? <ThreeDSpin family={family} /> : <Rich2DZoom family={family} />}

          <p className="font-sans text-sm text-charcoal-muted">{family.description}</p>

          {showSwatch && (
            <SwatchSwitch
              label={swatchAxis!.label}
              values={swatchAxis!.values!}
              selected={selections[swatchAxis!.key] ?? swatchAxis!.values![0]}
              onSelect={(v) => setSelections((s) => ({ ...s, [swatchAxis!.key]: v }))}
            />
          )}

          {showSize && <SizeComparison axis={sizeAxis!} />}
          {showContext && <ContextVisualizer family={family} />}

          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-charcoal-faint">
              Specifications
            </span>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                {family.variantAxes.map((ax, i) => (
                  <tr key={i} className="border-b border-cream-300">
                    <td className="py-2 pr-4 align-top font-sans text-sm text-charcoal-muted">
                      {ax.label}
                      {ax.isIdentifier && (
                        <span className="ml-1.5 rounded bg-cream-200 px-1 py-0.5 font-mono text-[10px] text-charcoal-faint">
                          id
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-sm text-charcoal">
                      {ax.values
                        ? ax.values.join(', ')
                        : ax.range
                          ? formatRange(ax.range.min, ax.range.max, displayUnit(ax.unit, ax.normalizedUnit))
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-0 -mx-6 border-t border-cream-300 bg-cream/95 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-sans text-sm text-charcoal">{variantLabel}</p>
                <p className="font-mono text-[11px] text-charcoal-faint">adds a line to the quote</p>
              </div>
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex shrink-0 items-center gap-1.5 bg-charcoal px-4 py-2 font-sans text-sm font-medium tracking-wide text-cream shadow-sm transition-colors hover:bg-charcoal-light"
              >
                {added ? <Check size={15} /> : <Cart size={15} />}
                {added ? 'Added' : 'Add to quote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

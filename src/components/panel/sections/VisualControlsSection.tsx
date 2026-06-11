import { useRef, useState } from 'react'
import { useAnalysisStore } from '../../../store/useAnalysisStore'
import type { ExperienceModule, Family, ThreeDTier } from '../../../schema'
import { THREE_D_TIERS } from '../../../schema'
import Toggle from '../../common/Toggle'
import { ChevronDown, Cube, Eye, Ruler, Swatch, Upload, Zoom } from '../../common/icons'

const MODULES: { key: Exclude<ExperienceModule, 'threeDSpin'>; label: string; Icon: typeof Swatch }[] = [
  { key: 'swatchSwitch', label: 'Swatch switch', Icon: Swatch },
  { key: 'sizeComparison', label: 'Size comparison', Icon: Ruler },
  { key: 'rich2DZoom', label: 'Rich 2D zoom', Icon: Zoom },
  { key: 'contextVisualizer', label: 'Context visualizer', Icon: Eye },
]

const TIER_LABELS: Record<ThreeDTier, string> = {
  A: 'A · convert existing CAD',
  B: 'B · AI image-to-3D (impression only)',
  C: 'C · parametric (later)',
  D: 'D · rich 2D fallback',
}

const SIZES = ['sm', 'md', 'lg'] as const

function Segmented({
  value,
  onChange,
}: {
  value: 'sm' | 'md' | 'lg'
  onChange: (v: 'sm' | 'md' | 'lg') => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-cream-300">
      {SIZES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-2.5 py-1 font-mono text-[10px] uppercase transition-colors ${
            value === s ? 'bg-charcoal text-cream' : 'bg-surface text-charcoal-muted hover:bg-cream-200'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function FamilyVisualEditor({ family }: { family: Family }) {
  const [open, setOpen] = useState(false)
  const setExperienceModule = useAnalysisStore((s) => s.setExperienceModule)
  const setThreeDWarranted = useAnalysisStore((s) => s.setThreeDWarranted)
  const setThreeDTier = useAnalysisStore((s) => s.setThreeDTier)
  const setFamilyPresentation = useAnalysisStore((s) => s.setFamilyPresentation)
  const setSwatchAxisKey = useAnalysisStore((s) => s.setSwatchAxisKey)
  const setSizeComparisonAxisKey = useAnalysisStore((s) => s.setSizeComparisonAxisKey)
  const setFamilyImage = useAnalysisStore((s) => s.setFamilyImage)
  const fileRef = useRef<HTMLInputElement>(null)

  const mods = new Set(family.experienceModules)
  const presentation = family.presentation ?? { cardSize: 'md' as const, detailSize: 'lg' as const }
  const categoricalAxes = family.variantAxes.filter((a) => a.type === 'categorical' && !a.isIdentifier)
  const rangeAxes = family.variantAxes.filter((a) => a.range !== null)
  const img = family.images[0]

  const onReplace = (file: File) => {
    const reader = new FileReader()
    reader.onload = () =>
      setFamilyImage(family.id, 0, { src: reader.result as string, missing: false, quality: 'good' })
    reader.readAsDataURL(file)
  }

  return (
    <div className="overflow-hidden ia-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ChevronDown
          size={14}
          className={`shrink-0 text-charcoal-faint transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        />
        <span className="min-w-0 flex-1 truncate font-serif text-sm text-charcoal">{family.name}</span>
        <span className="shrink-0 font-mono text-[10px] text-charcoal-faint">
          {family.experienceModules.length} modules{family.threeD.warranted ? ' · 3D' : ''}
        </span>
      </button>

      {open && (
        <div className="space-y-3.5 border-t border-cream-300 bg-cream/50 p-3">
          {/* experience modules */}
          <div className="space-y-1.5">
            {MODULES.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon size={13} className="text-charcoal-faint" />
                <span className="flex-1 font-sans text-xs text-charcoal">{label}</span>
                <Toggle
                  checked={mods.has(key)}
                  onChange={(on) => setExperienceModule(family.id, key, on)}
                  label={`${label} for ${family.name}`}
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Cube size={13} className="text-charcoal-faint" />
              <span className="flex-1 font-sans text-xs text-charcoal">3D spin (gated)</span>
              <Toggle
                checked={family.threeD.warranted}
                onChange={(on) => setThreeDWarranted(family.id, on)}
                label={`3D for ${family.name}`}
              />
            </div>
            {family.threeD.warranted && (
              <select
                value={family.threeD.tier}
                onChange={(e) => setThreeDTier(family.id, e.target.value as ThreeDTier)}
                className="mt-1 w-full rounded-md border border-cream-300 bg-surface px-2 py-1 font-sans text-xs text-charcoal"
              >
                {THREE_D_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {TIER_LABELS[t]}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* module data sources */}
          {(categoricalAxes.length > 0 || rangeAxes.length > 0) && (
            <div className="grid grid-cols-2 gap-2 border-t border-cream-300 pt-3">
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">
                  swatch axis
                </span>
                <select
                  value={family.swatchAxisKey ?? ''}
                  onChange={(e) => setSwatchAxisKey(family.id, e.target.value || null)}
                  className="mt-0.5 w-full rounded-md border border-cream-300 bg-surface px-1.5 py-1 font-sans text-[11px] text-charcoal"
                >
                  <option value="">none</option>
                  {categoricalAxes.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">
                  size axis
                </span>
                <select
                  value={family.sizeComparisonAxisKey ?? ''}
                  onChange={(e) => setSizeComparisonAxisKey(family.id, e.target.value || null)}
                  className="mt-0.5 w-full rounded-md border border-cream-300 bg-surface px-1.5 py-1 font-sans text-[11px] text-charcoal"
                >
                  <option value="">none</option>
                  {rangeAxes.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* display sizing */}
          <div className="flex items-center justify-between gap-3 border-t border-cream-300 pt-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">card</p>
              <Segmented
                value={presentation.cardSize}
                onChange={(v) => setFamilyPresentation(family.id, { cardSize: v })}
              />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">detail</p>
              <Segmented
                value={presentation.detailSize}
                onChange={(v) => setFamilyPresentation(family.id, { detailSize: v })}
              />
            </div>
          </div>

          {/* image */}
          {img && (
            <div className="flex items-center gap-2 border-t border-cream-300 pt-3">
              <span className="rounded-full bg-cream-200 px-2 py-0.5 font-mono text-[9px] uppercase text-charcoal-muted">
                image: {img.missing ? 'missing' : img.quality}
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="ml-auto inline-flex items-center gap-1 font-sans text-[11px] text-charcoal underline-offset-2 hover:underline"
              >
                <Upload size={11} /> Replace
              </button>
              <button
                type="button"
                onClick={() => setFamilyImage(family.id, 0, { missing: !img.missing })}
                className="font-sans text-[11px] text-charcoal-muted underline-offset-2 hover:underline"
              >
                {img.missing ? 'Restore' : 'Mark missing'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onReplace(f)
                  e.target.value = ''
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VisualControlsSection() {
  const families = useAnalysisStore((s) => s.analysis?.core.catalog?.families)
  if (!families) return null

  return (
    <div className="space-y-2">
      <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
        Per-family presentation: experience modules, display sizing, the gated 3D slot, and images.
      </p>
      {families.map((f) => (
        <FamilyVisualEditor key={f.id} family={f} />
      ))}
    </div>
  )
}

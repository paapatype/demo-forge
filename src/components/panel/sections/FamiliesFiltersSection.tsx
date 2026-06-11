import { useState } from 'react'
import { useAnalysisStore } from '../../../store/useAnalysisStore'
import type { Family, VariantAxis } from '../../../schema'
import EditableText from '../../common/EditableText'
import Toggle from '../../common/Toggle'
import { ChevronDown } from '../../common/icons'

/** Uncontrolled number input that commits on blur/Enter; remounts when the store value changes. */
function NumberField({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  return (
    <input
      key={value}
      type="number"
      defaultValue={value}
      onBlur={(e) => {
        const n = Number(e.target.value)
        if (!Number.isNaN(n) && n !== value) onCommit(n)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="w-[4.5rem] rounded-sm border border-cream-300 bg-surface px-1.5 py-0.5 font-mono text-xs text-charcoal"
    />
  )
}

function AxisEditor({ familyId, axis, index }: { familyId: string; axis: VariantAxis; index: number }) {
  const toggleAxisFilter = useAnalysisStore((s) => s.toggleAxisFilter)
  const toggleAxisIdentifier = useAnalysisStore((s) => s.toggleAxisIdentifier)
  const renameAxisLabel = useAnalysisStore((s) => s.renameAxisLabel)
  const setAxisUnit = useAnalysisStore((s) => s.setAxisUnit)
  const setAxisNormalizedUnit = useAnalysisStore((s) => s.setAxisNormalizedUnit)
  const setAxisValues = useAnalysisStore((s) => s.setAxisValues)
  const setAxisRange = useAnalysisStore((s) => s.setAxisRange)

  return (
    <div className="rounded-md border border-cream-300 bg-cream-200/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <EditableText
          value={axis.label}
          onCommit={(v) => renameAxisLabel(familyId, index, v)}
          className="font-sans text-xs font-medium text-charcoal"
        />
        <span className="shrink-0 rounded-full bg-cream-200 px-2 py-0.5 font-mono text-[9px] uppercase text-charcoal-muted">
          {axis.type}
        </span>
      </div>

      {axis.type === 'categorical' ? (
        <div className="mt-1.5">
          <EditableText
            value={(axis.values ?? []).join(', ')}
            onCommit={(v) =>
              setAxisValues(
                familyId,
                index,
                v.split(',').map((s) => s.trim()).filter(Boolean),
              )
            }
            mono
            className="w-full text-[11px] text-charcoal-muted"
            placeholder="comma-separated values"
          />
        </div>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <NumberField
            value={axis.range?.min ?? 0}
            onCommit={(n) => setAxisRange(familyId, index, { min: n, max: axis.range?.max ?? n })}
          />
          <span className="text-charcoal-faint">–</span>
          <NumberField
            value={axis.range?.max ?? 0}
            onCommit={(n) => setAxisRange(familyId, index, { min: axis.range?.min ?? n, max: n })}
          />
          <span className="ml-1 font-mono text-[9px] uppercase text-charcoal-faint">unit</span>
          <EditableText
            value={axis.unit ?? ''}
            onCommit={(v) => setAxisUnit(familyId, index, v || null)}
            mono
            allowEmpty
            className="text-[11px] text-charcoal"
          />
          <span className="font-mono text-[9px] text-charcoal-faint">→</span>
          <EditableText
            value={axis.normalizedUnit ?? ''}
            onCommit={(v) => setAxisNormalizedUnit(familyId, index, v || null)}
            mono
            allowEmpty
            className="text-[11px] text-charcoal"
          />
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-4 border-t border-cream-300 pt-2">
        <span className="flex items-center gap-1.5">
          <Toggle
            checked={axis.isFilter}
            disabled={axis.isIdentifier}
            onChange={() => toggleAxisFilter(familyId, index)}
            label={`${axis.label} is a buyer filter`}
          />
          <span className={`font-sans text-[11px] ${axis.isFilter ? 'font-medium text-charcoal' : 'text-charcoal-muted'}`}>
            Buyer filter
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Toggle
            checked={axis.isIdentifier}
            onChange={() => toggleAxisIdentifier(familyId, index)}
            label={`${axis.label} is an identifier`}
          />
          <span className="font-sans text-[11px] text-charcoal-muted">Identifier</span>
        </span>
        {axis.isIdentifier && (
          <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-charcoal-faint">
            never a filter
          </span>
        )}
      </div>
    </div>
  )
}

function FamilyEditor({ family }: { family: Family }) {
  const [open, setOpen] = useState(false)
  const renameFamily = useAnalysisStore((s) => s.renameFamily)
  const editFamilyDescription = useAnalysisStore((s) => s.editFamilyDescription)
  const filterCount = family.variantAxes.filter((a) => a.isFilter && !a.isIdentifier).length

  return (
    <div className="overflow-hidden ia-card">
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown
          size={14}
          className={`shrink-0 text-charcoal-faint transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        />
        <span className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
          <EditableText
            value={family.name}
            onCommit={(v) => renameFamily(family.id, v)}
            className="max-w-full font-serif text-sm text-charcoal"
          />
        </span>
        <span className="shrink-0 font-mono text-[10px] text-charcoal-faint">
          {filterCount} filters · {family.skuCount} SKUs
        </span>
      </div>

      {open && (
        <div className="space-y-2 border-t border-cream-300 bg-cream/50 p-2.5">
          <EditableText
            value={family.description}
            onCommit={(v) => editFamilyDescription(family.id, v)}
            multiline
            className="w-full text-[11px] leading-relaxed text-charcoal-muted"
            placeholder="description"
          />
          {family.variantAxes.map((axis, i) => (
            <AxisEditor key={`${family.id}-${i}`} familyId={family.id} axis={axis} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FamiliesFiltersSection() {
  const families = useAnalysisStore((s) => s.analysis?.core.catalog?.families)
  if (!families) return null

  return (
    <div className="space-y-2">
      <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
        Toggle which spec columns become buyer-facing filters — the filter bar updates live.
        Identifiers (part numbers) are never filters.
      </p>
      {families.map((f) => (
        <FamilyEditor key={f.id} family={f} />
      ))}
    </div>
  )
}

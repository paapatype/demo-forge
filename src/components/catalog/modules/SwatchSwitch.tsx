import { swatchStyle } from '../swatchColors'

/** Finish/colour toggle (e.g. packaging finishes). */
export default function SwatchSwitch({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string
  values: string[]
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-charcoal-faint">
          {label}
        </span>
        <span className="font-sans text-sm text-charcoal">{selected}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => {
          const s = swatchStyle(v)
          const active = v === selected
          return (
            <button
              key={v}
              type="button"
              title={v}
              onClick={() => onSelect(v)}
              className={`h-8 w-8 rounded-full transition-transform duration-150 ease-out hover:scale-105 ${
                active ? 'ring-2 ring-charcoal ring-offset-2 ring-offset-surface' : ''
              }`}
              style={{ background: s.background, border: s.border }}
            />
          )
        })}
      </div>
    </div>
  )
}

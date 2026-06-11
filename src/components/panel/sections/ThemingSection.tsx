import { useRef } from 'react'
import { useAnalysisStore } from '../../../store/useAnalysisStore'
import type { BrandColors } from '../../../schema'
import EditableText from '../../common/EditableText'
import { Upload } from '../../common/icons'

const COLOR_FIELDS: { key: keyof BrandColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
]

export default function ThemingSection() {
  const brand = useAnalysisStore((s) => s.analysis?.brand)
  const client = useAnalysisStore((s) => s.analysis?.meta.client)
  const setBrandColor = useAnalysisStore((s) => s.setBrandColor)
  const setLogo = useAnalysisStore((s) => s.setLogo)
  const setClientName = useAnalysisStore((s) => s.setClientName)
  const fileRef = useRef<HTMLInputElement>(null)
  if (!brand || client === undefined) return null

  const onLogoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-[11px] leading-relaxed text-charcoal-muted">
        The client's colours and logo skin the product presentation live. The IndexArch chrome
        never changes — re-skinning is a data change, not a code change.
      </p>

      {/* client name */}
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Client name
        </span>
        <div className="mt-1">
          <EditableText
            value={client}
            onCommit={setClientName}
            className="w-full rounded-md border border-cream-300 bg-surface px-2.5 py-1.5 font-serif text-sm text-charcoal"
          />
        </div>
      </label>

      {/* brand colours */}
      <div className="space-y-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-md border border-cream-300 bg-surface px-2.5 py-2"
          >
            <input
              type="color"
              value={brand.colors[key]}
              onChange={(e) => setBrandColor(key, e.target.value)}
              aria-label={`${label} brand colour`}
              className="h-7 w-9 shrink-0 cursor-pointer rounded border border-cream-300 bg-surface p-0.5"
            />
            <span className="flex-1 font-sans text-xs text-charcoal">{label}</span>
            <EditableText
              value={brand.colors[key]}
              onCommit={(v) => {
                const hex = v.startsWith('#') ? v : `#${v}`
                if (/^#[0-9a-fA-F]{6}$/.test(hex)) setBrandColor(key, hex.toLowerCase())
              }}
              mono
              className="text-[11px] text-charcoal-muted"
            />
          </div>
        ))}
      </div>

      {/* logo */}
      <div className="rounded-md border border-cream-300 bg-surface p-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-faint">
          Logo
        </span>
        {brand.logo ? (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={brand.logo}
              alt="Client logo"
              className="h-9 max-w-[140px] rounded border border-cream-300 bg-surface object-contain p-1"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="font-sans text-[11px] text-charcoal underline-offset-2 hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setLogo(null)}
              className="font-sans text-[11px] text-charcoal-muted underline-offset-2 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-cream-300 px-3 py-1.5 font-sans text-xs text-charcoal-muted transition-colors hover:border-charcoal/40 hover:text-charcoal"
          >
            <Upload size={12} /> Upload logo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onLogoFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

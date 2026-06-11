import { useRef, useState, type DragEvent } from 'react'
import { Upload } from './icons'

/**
 * PDF dropzone. `compact` renders a small button (top-bar re-analyze); otherwise the full hero
 * drop area. Only the file is captured here — base64/transport happens in the proxy.
 */
export default function Dropzone({
  onFile,
  compact = false,
  label = 'Re-analyze',
}: {
  onFile: (file: File) => void
  compact?: boolean
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (f) onFile(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDrag(false)
    pick(e.dataTransfer.files)
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf"
      className="hidden"
      onChange={(e) => pick(e.target.files)}
    />
  )

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 ia-btn-quiet"
        >
          <Upload size={15} />
          {label}
        </button>
        {input}
      </>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-10 py-16 text-center transition-colors duration-200 ease-out ${
        drag
          ? 'border-charcoal bg-charcoal/5'
          : 'border-cream-300 bg-surface hover:border-charcoal/60 hover:bg-cream-200/50'
      }`}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-charcoal/10 text-charcoal transition-transform duration-200 ease-out group-hover:scale-105">
        <Upload size={24} />
      </div>
      <p className="mt-5 font-serif text-xl text-charcoal">Drop a manufacturer PDF</p>
      <p className="mt-1.5 max-w-sm font-sans text-sm text-charcoal-muted">
        We detect the catalogue archetype, then extract its structure into an editable, branded
        catalogue.
      </p>
      <p className="mt-4 font-mono text-xs text-charcoal-faint">PDF · clean-digital or image-heavy</p>
      {input}
    </div>
  )
}

import { useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from './icons'
import { useOutsideClick } from './useOutsideClick'

/**
 * Lightweight dropdown: a trigger button + an absolutely-positioned panel that closes on outside
 * click / Escape. No portal — fine for the filter bar and small menus.
 */
export default function Popover({
  label,
  count,
  active,
  align = 'left',
  children,
  panelClassName = '',
}: {
  label: ReactNode
  count?: number
  active?: boolean
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false), open)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-sm transition-colors duration-150 ease-out ${
          active || open
            ? 'border-charcoal/50 bg-charcoal/8 text-charcoal'
            : 'border-cream-300 bg-surface text-charcoal hover:bg-cream-200'
        }`}
      >
        <span>{label}</span>
        {count !== undefined && count > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-charcoal px-1 font-mono text-[10px] text-cream">
            {count}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute z-30 mt-2 min-w-[13rem] ia-card p-2 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

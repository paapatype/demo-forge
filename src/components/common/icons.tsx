import type { SVGProps } from 'react'

/** Small stroke icon set (16px default), inheriting currentColor. */
function Base({ children, size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const ChevronDown = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
)
export const Close = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Base>
)
export const Check = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Base>
)
export const Plus = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)
export const Minus = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
)
export const Filter = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </Base>
)
export const ImageIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </Base>
)
export const Cube = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M21 7.5L12 3 3 7.5m18 0L12 12m9-4.5v9L12 21m0-9L3 7.5m9 4.5v9M3 7.5v9L12 21" />
  </Base>
)
export const Swatch = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="8" cy="8" r="4" />
    <circle cx="16" cy="8" r="4" />
    <circle cx="12" cy="15" r="4" />
  </Base>
)
export const Ruler = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M3 8h18v8H3z" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </Base>
)
export const Zoom = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
  </Base>
)
export const Eye = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
)
export const Upload = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M12 16V4m0 0L7 9m5-5l5 5" />
    <path d="M5 20h14" />
  </Base>
)
export const Download = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M12 4v12m0 0l5-5m-5 5l-5-5" />
    <path d="M5 20h14" />
  </Base>
)
export const Cart = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h3l2.4 12.4a1.6 1.6 0 001.6 1.3h8.2a1.6 1.6 0 001.6-1.2L22 7H6" />
  </Base>
)
export const Sparkle = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </Base>
)
export const Alert = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z" />
  </Base>
)
export const Pencil = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5z" />
  </Base>
)
export const Archive = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
    <path d="M10 12h4" />
  </Base>
)
export const Gear = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Base>
)

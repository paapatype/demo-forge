import { useRef, useState } from 'react'
import type { Family } from '../../../schema'
import ImageWithFallback from '../../common/ImageWithFallback'
import { Zoom } from '../../common/icons'

/** Universal fallback module — always available. Hover to magnify (cursor-anchored). */
export default function Rich2DZoom({ family }: { family: Family }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
      }}
      onMouseLeave={() => setPos(null)}
      className="relative aspect-[4/3] overflow-hidden ia-card"
    >
      <div
        className="h-full w-full transition-transform duration-200 ease-out"
        style={pos ? { transform: 'scale(1.9)', transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
      >
        <ImageWithFallback
          image={family.images[0]}
          name={family.name}
          className="h-full w-full"
          rounded="rounded-none"
        />
      </div>
      <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2 py-0.5 font-mono text-[10px] text-charcoal-muted backdrop-blur-sm">
        <Zoom size={11} /> hover to zoom
      </span>
    </div>
  )
}

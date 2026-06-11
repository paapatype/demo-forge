import type { ImageRef } from '../../schema'
import { ImageIcon } from './icons'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Never blocks on a missing image (§12). With a usable src it renders the photo; otherwise a
 * brand-tinted placeholder with the family initials and a small status tag (no image / low-res /
 * placeholder), so the layout always looks intentional.
 */
export default function ImageWithFallback({
  image,
  name,
  className = '',
  rounded = 'rounded-lg',
}: {
  image: ImageRef | undefined
  name: string
  className?: string
  rounded?: string
}) {
  const usable = image && image.src && !image.missing
  if (usable) {
    return (
      <img
        src={image!.src as string}
        alt={name}
        className={`${className} ${rounded} object-cover`}
        loading="lazy"
      />
    )
  }

  const tag = !image || image.missing ? 'no image' : image.quality === 'low' ? 'low-res' : 'placeholder'

  return (
    <div
      className={`${className} ${rounded} relative grid place-items-center overflow-hidden`}
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 16%, rgb(var(--c-surface))), color-mix(in srgb, var(--brand-secondary) 14%, rgb(var(--c-surface))))',
      }}
    >
      <span className="select-none font-serif text-4xl text-brand-primary opacity-70">
        {initials(name)}
      </span>
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2 py-0.5 font-mono text-[10px] text-charcoal-muted backdrop-blur-sm">
        <ImageIcon size={11} />
        {tag}
      </span>
    </div>
  )
}

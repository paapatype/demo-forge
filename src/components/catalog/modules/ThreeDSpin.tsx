import { createElement, useEffect, useState } from 'react'
import type { Family } from '../../../schema'
import { Cube } from '../../common/icons'

/**
 * Optional 3D slot (§9). model-viewer is lazy-loaded and only used when a model path exists; with
 * no model it degrades to a labelled 2D notice. Never blocks rendering.
 */
export default function ThreeDSpin({ family }: { family: Family }) {
  const path = family.threeD.path
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!path) return
    let active = true
    import('@google/model-viewer')
      .then(() => active && setReady(true))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [path])

  if (!path || failed) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cream-300 bg-surface text-center">
        <Cube size={26} className="text-charcoal-faint" />
        <p className="font-sans text-sm text-charcoal-muted">
          3D preview (tier {family.threeD.tier}) — model not attached.
        </p>
        <p className="font-mono text-[11px] text-charcoal-faint">Showing 2D · degrades gracefully</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="grid aspect-[4/3] place-items-center ia-card">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-cream-300 border-t-charcoal" />
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createElement('model-viewer', {
    src: path,
    'camera-controls': true,
    'auto-rotate': true,
    'shadow-intensity': '1',
    style: {
      width: '100%',
      height: '320px',
      background: 'rgb(var(--c-surface))',
      borderRadius: '12px',
    },
  } as any)
}

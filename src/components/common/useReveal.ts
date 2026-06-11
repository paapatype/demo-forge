import { useEffect, useRef } from 'react'

/**
 * Subtle scroll-reveal (the spacelab-style entrance): adds .reveal, then .is-visible when the
 * element enters the viewport. CSS handles the motion and the reduced-motion override.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('reveal')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

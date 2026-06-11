/**
 * Theming is data, not code (§10): brand colours come from analysis.brand and are applied at
 * runtime as --brand-* CSS variables. The IndexArch chrome (cream/terracotta/charcoal) is never
 * touched — only product presentation picks up the client's colours.
 */
import type { BrandColors } from '../schema'
import type { CSSProperties } from 'react'

/** Inline style object that scopes the brand vars to a wrapper element (no flash, no effect). */
export function brandVars(colors: BrandColors): CSSProperties {
  return {
    '--brand-primary': colors.primary,
    '--brand-secondary': colors.secondary,
    '--brand-accent': colors.accent,
  } as CSSProperties
}

/** Imperative variant, for applying brand vars to an existing element (e.g. document root). */
export function applyBrand(el: HTMLElement, colors: BrandColors): void {
  el.style.setProperty('--brand-primary', colors.primary)
  el.style.setProperty('--brand-secondary', colors.secondary)
  el.style.setProperty('--brand-accent', colors.accent)
}

/** Map a finish/material value name to a presentable swatch fill. Best-effort, name-based. */
export function swatchStyle(value: string): { background: string; border: string } {
  const v = value.toLowerCase()
  const line = '1px solid rgb(var(--c-cream-300))'
  if (v.includes('white')) return { background: '#ffffff', border: line }
  if (v.includes('kraft')) return { background: '#b48a5e', border: 'none' }
  if (v.includes('clear') || v.includes('pet')) return { background: 'linear-gradient(135deg,#eaf2f5,#cfe0e6)', border: line }
  if (v.includes('full-colour') || v.includes('printed') || v.includes('print'))
    return { background: 'conic-gradient(from 20deg,#e0a14e,#bf5b3a,#2e7d5b,#37485a,#e0a14e)', border: 'none' }
  if (v.includes('single-colour')) return { background: '#bf5b3a', border: 'none' }
  return { background: 'rgb(var(--c-cream-200))', border: line }
}

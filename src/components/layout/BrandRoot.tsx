import type { ReactNode } from 'react'
import type { Brand } from '../../schema'
import { brandVars } from '../../theme/applyBrand'

/** Scopes the client's --brand-* variables to its subtree. Chrome tokens stay untouched. */
export default function BrandRoot({
  brand,
  className,
  children,
}: {
  brand: Brand
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className} style={brandVars(brand.colors)}>
      {children}
    </div>
  )
}

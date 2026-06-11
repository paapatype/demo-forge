import type { ReactNode } from 'react'

/**
 * Shell: top bar across the top, the live rendered catalogue in the main scroll area, and the
 * fixed, scrollable review-and-adjust panel on the right (§7).
 */
export default function AppLayout({
  topBar,
  main,
  panel,
}: {
  topBar: ReactNode
  main: ReactNode
  panel?: ReactNode
}) {
  return (
    <div className="flex h-screen flex-col bg-cream text-charcoal">
      {topBar}
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">{main}</main>
        {panel && (
          <aside className="hidden w-[400px] shrink-0 overflow-y-auto border-l border-cream-300 bg-surface-sunken xl:block">
            {panel}
          </aside>
        )}
      </div>
    </div>
  )
}

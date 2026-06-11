import { useState } from 'react'
import { useAnalysisStore } from '../../store/useAnalysisStore'
import { Cart, Check, Close, Minus, Plus } from '../common/icons'

/** Multi-line quote builder (no pricing). Floating trigger + modal; Request Quote is stubbed. */
export default function QuoteCart() {
  const cart = useAnalysisStore((s) => s.cart)
  const setCartQty = useAnalysisStore((s) => s.setCartQty)
  const removeCartLine = useAnalysisStore((s) => s.removeCartLine)
  const clearCart = useAnalysisStore((s) => s.clearCart)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const count = cart.reduce((n, l) => n + l.qty, 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="df-quote-fab fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 bg-charcoal px-4 py-3 text-cream shadow-lg transition-transform duration-150 hover:scale-105 xl:right-[424px]"
      >
        <Cart size={18} />
        <span className="font-sans text-sm font-medium">Quote</span>
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 font-mono text-[11px] text-charcoal">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-charcoal/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-cream shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cream-300 px-6 py-4">
              <h2 className="font-serif text-xl">Quote request</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream-200"
              >
                <Close size={18} />
              </button>
            </div>

            {requested ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-status-good/15 text-status-good">
                  <Check size={24} />
                </div>
                <p className="mt-4 font-serif text-lg">Quote request sent</p>
                <p className="mt-1 font-sans text-sm text-charcoal-muted">
                  Stub — no pricing in v0. The downstream build wires the real submit.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="px-6 py-12 text-center font-sans text-sm text-charcoal-muted">
                Your quote is empty. Open a family and add a variant.
              </div>
            ) : (
              <>
                <div className="max-h-[50vh] divide-y divide-cream-300 overflow-y-auto">
                  {cart.map((line) => (
                    <div key={line.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-sm text-charcoal">{line.familyName}</p>
                        <p className="truncate font-mono text-[11px] text-charcoal-muted">
                          {line.variantLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCartQty(line.id, line.qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 hover:bg-cream-200"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center font-mono text-sm">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setCartQty(line.id, line.qty + 1)}
                          className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 hover:bg-cream-200"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartLine(line.id)}
                        className="text-charcoal-faint hover:text-status-high"
                      >
                        <Close size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-cream-300 px-6 py-4">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="font-sans text-xs text-charcoal-muted underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequested(true)}
                    className="bg-charcoal px-5 py-2 font-sans text-sm font-medium tracking-wide text-cream hover:bg-charcoal-light"
                  >
                    Request quote ({count})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

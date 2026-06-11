import { useState } from 'react'
import { clearApiKey, maskedKey, setApiKey } from '../../settings/apiKey'
import { Check, Close } from '../common/icons'

/**
 * Runtime API-key entry. The key is stored ONLY in this browser's localStorage — never committed,
 * never sent to us, never in the build. On the hosted (Pages) build this is how real analysis is
 * enabled; the demo catalogues work without it.
 */
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('')
  const [mask, setMask] = useState<string | null>(maskedKey())
  const [saved, setSaved] = useState(false)

  const save = () => {
    if (!value.trim()) return
    setApiKey(value.trim())
    setMask(maskedKey())
    setValue('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }
  const clear = () => {
    clearApiKey()
    setMask(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-charcoal/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl rounded-bl-sm border border-cream-300 bg-cream shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cream-300 px-6 py-4">
          <h2 className="font-serif text-xl text-charcoal">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-charcoal hover:bg-cream-200"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="eyebrow">Anthropic API key</p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal-muted">
            Needed to analyze your own PDFs. It is stored <strong className="text-charcoal">only in
            this browser</strong> — never sent to us, never in the code. The demo catalogues work
            without it. Get a key at{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-charcoal underline decoration-cream-300 underline-offset-2 hover:decoration-charcoal"
            >
              console.anthropic.com
            </a>
            .
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-xs text-charcoal-muted">
              {mask ? (
                <span className="inline-flex items-center gap-1 text-status-good">
                  <Check size={13} /> key set · {mask}
                </span>
              ) : (
                <span className="text-charcoal-faint">no key set</span>
              )}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="sk-ant-…"
              className="min-w-0 flex-1 rounded-sm border border-cream-300 bg-surface px-3 py-2 font-mono text-sm text-charcoal"
            />
            <button type="button" onClick={save} disabled={!value.trim()} className="ia-btn ia-btn-sm">
              {saved ? <Check size={15} /> : null}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          {mask && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 font-sans text-xs text-charcoal-muted underline-offset-2 hover:underline"
            >
              Remove key from this browser
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

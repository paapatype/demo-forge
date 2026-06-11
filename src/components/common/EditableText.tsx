import { useEffect, useRef, useState } from 'react'
import { Pencil } from './icons'

/**
 * Click-to-edit inline text. Commits on blur / Enter (single-line), cancels on Escape. Empty
 * commits are rejected unless `allowEmpty` (clearing a unit is legit; clearing a name is not).
 */
export default function EditableText({
  value,
  onCommit,
  multiline = false,
  mono = false,
  allowEmpty = false,
  className = '',
  placeholder = '—',
}: {
  value: string
  onCommit: (next: string) => void
  multiline?: boolean
  mono?: boolean
  allowEmpty?: boolean
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) return
    const el = multiline ? areaRef.current : inputRef.current
    el?.focus()
    el?.select()
  }, [editing, multiline])

  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next === value) return
    if (next.length === 0 && !allowEmpty) {
      setDraft(value)
      return
    }
    onCommit(next)
  }
  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        title="Click to edit"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className={`group/edit inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-sm text-left transition-colors hover:bg-cream-200/70 ${className}`}
      >
        <span className={`min-w-0 truncate ${mono ? 'font-mono' : ''} ${value ? '' : 'text-charcoal-faint'}`}>
          {value || placeholder}
        </span>
        <Pencil
          size={11}
          className="shrink-0 text-charcoal-faint opacity-0 transition-opacity duration-150 group-hover/edit:opacity-100"
        />
      </button>
    )
  }

  const sharedClass = `w-full rounded-sm border border-charcoal/30 bg-surface px-1.5 py-0.5 text-charcoal ${
    mono ? 'font-mono' : 'font-sans'
  } ${className}`

  if (multiline) {
    return (
      <textarea
        ref={areaRef}
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel()
        }}
        className={sharedClass}
      />
    )
  }
  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') cancel()
      }}
      className={sharedClass}
    />
  )
}

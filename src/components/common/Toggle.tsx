/** Small switch. Ink when on, rule-grey when off; disabled = locked (e.g. identifier ⇒ never a filter). */
export default function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? 'bg-charcoal' : 'bg-cream-300'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-[14px] w-[14px] rounded-full bg-surface shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-[14px]' : ''
        }`}
      />
    </button>
  )
}

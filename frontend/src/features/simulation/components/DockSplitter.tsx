import { useEffect, useRef } from 'react'
export default function DockSplitter({
  label,
  axis = 'vertical',
  value,
  min,
  max,
  onChange,
  reverse = false,
}: {
  label: string
  axis?: 'vertical' | 'horizontal'
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  reverse?: boolean
}) {
  useEffect(() => () => document.body.classList.remove('resizing-dock'), [])
  const drag = useRef<{ pointer: number; start: number; value: number } | null>(null)
  const clamp = (n: number) => Math.round(Math.min(max, Math.max(min, n)))
  return (
    <div
      className={`dock-splitter ${axis}`}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={axis}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = {
          pointer: e.pointerId,
          start: axis === 'vertical' ? e.clientX : e.clientY,
          value,
        }
        document.body.classList.add('resizing-dock')
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const delta = (axis === 'vertical' ? e.clientX : e.clientY) - drag.current.start
        onChange(clamp(drag.current.value + delta * (reverse ? -1 : 1)))
      }}
      onPointerUp={(e) => {
        drag.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
        document.body.classList.remove('resizing-dock')
      }}
      onLostPointerCapture={() => {
        drag.current = null
        document.body.classList.remove('resizing-dock')
      }}
      onKeyDown={(e) => {
        const positive = axis === 'vertical' ? 'ArrowRight' : 'ArrowDown',
          negative = axis === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
        if (e.key === positive || e.key === negative) {
          e.preventDefault()
          onChange(clamp(value + (e.key === positive ? 16 : -16) * (reverse ? -1 : 1)))
        } else if (e.key === 'Home') {
          e.preventDefault()
          onChange(min)
        } else if (e.key === 'End') {
          e.preventDefault()
          onChange(max)
        }
      }}
    >
      <span />
    </div>
  )
}

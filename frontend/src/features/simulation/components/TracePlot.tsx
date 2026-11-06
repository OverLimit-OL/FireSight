import { useEffect, useRef, useState } from 'react'
import type { SimulationFrame } from '@/types/simulation'
export default function TracePlot({
  frames,
  entityId,
  index,
  onIndex,
}: {
  frames: SimulationFrame[]
  entityId: string
  index: number
  onIndex: (index: number) => void
}) {
  const chart = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(700)
  const [height, setHeight] = useState(160)
  useEffect(() => {
    if (!chart.current) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(180, Math.round(entry.contentRect.width)))
      setHeight(Math.max(65, Math.round(entry.contentRect.height)))
    })
    observer.observe(chart.current)
    return () => observer.disconnect()
  }, [])
  const selectedValue = frames[index]?.measurements.find((m) => m.entityId === entityId)?.value
  const baseline = height - 24,
    amplitude = Math.max(20, height - 44)
  const points = frames.map((f, i) => ({
    x: 45 + i * ((width - 65) / Math.max(1, frames.length - 1)),
    y: f.measurements.find((m) => m.entityId === entityId)?.value ?? null,
  }))
  return (
    <section className="simulation-trace" aria-label="Selected sample over time">
      <div className="section-heading">
        <h3>
          Sample trace <span className="mono muted">{entityId}</span>
        </h3>
        <span>
          Dimensionless ·{' '}
          <output>
            {selectedValue === null || selectedValue === undefined
              ? 'Missing'
              : selectedValue.toFixed(3)}
          </output>
        </span>
      </div>
      <svg
        ref={chart}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`Exact scalar samples for ${entityId}; use the timeline or each point to select a frame`}
      >
        <rect
          x="45"
          y="20"
          width={Math.max(1, width - 65)}
          height={amplitude}
          fill="currentColor"
          opacity=".025"
        />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1="45"
              y1={baseline - v * amplitude}
              x2={width - 20}
              y2={baseline - v * amplitude}
              className="trace-grid"
            />
            <text x="30" y={baseline + 4 - v * amplitude} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line
          x1={points[index].x}
          x2={points[index].x}
          y1="20"
          y2={baseline + 5}
          className="trace-cursor"
        />
        {points.map((p, i) =>
          p.y === null ? (
            <g
              key={frames[i].id}
              role="button"
              tabIndex={0}
              aria-label={`Inspect step ${frames[i].coordinate.value}, missing value`}
              onClick={() => onIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onIndex(i)
                }
              }}
            >
              <rect x={p.x - 14} y={baseline - 15} width="28" height="40" fill="transparent" />
              <text x={p.x} y={baseline - 4} textAnchor="middle">
                ×
              </text>
              <text x={p.x} y={height - 9} textAnchor="middle">
                {frames[i].coordinate.value}
              </text>
            </g>
          ) : (
            <g
              role="button"
              tabIndex={0}
              aria-label={`Inspect step ${frames[i].coordinate.value}, value ${p.y}`}
              key={frames[i].id}
              onClick={() => onIndex(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onIndex(i)
                }
              }}
            >
              <title>
                Step {frames[i].coordinate.value}: {p.y} (authored, dimensionless)
              </title>
              <line
                x1={p.x}
                x2={p.x}
                y1={baseline}
                y2={baseline - p.y * amplitude}
                className="trace-stem"
              />
              <circle cx={p.x} cy={baseline - p.y * amplitude} r="14" fill="transparent" />
              <circle
                cx={p.x}
                cy={baseline - p.y * amplitude}
                r={i === index ? 6 : 4}
                className="trace-point"
              />
              <text x={p.x} y={height - 9} textAnchor="middle">
                {frames[i].coordinate.value}
              </text>
            </g>
          ),
        )}
        <text x={width / 2} y={height - 1} textAnchor="middle"></text>
      </svg>
      <p className="muted">Points are discrete supplied values. × indicates a missing sample.</p>
    </section>
  )
}

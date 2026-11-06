import type { SimulationFrame } from '@/types/simulation'
import { fieldColor } from './palette'
export default function TwoDimensionalView({
  frame,
  selectedId,
  onSelect,
}: {
  frame: SimulationFrame
  selectedId: string
  onSelect: (id: string) => void
}) {
  const measurements = frame.measurements.filter((m) => m.coordinates[2] === 0)
  return (
    <svg
      className="field-slice"
      viewBox="70 10 390 350"
      role="group"
      aria-label="Two dimensional field slice at z equals zero"
    >
      <title>Illustrative scalar · z = 0 · coordinates dimensionless</title>
      <g className="slice-grid">
        {[-1, 0, 1].map((c) => (
          <g key={c}>
            <line x1="125" y1={180 - c * 94} x2="395" y2={180 - c * 94} />
            <line x1={260 + c * 94} y1="48" x2={260 + c * 94} y2="312" />
            <text x={260 + c * 94} y="338" textAnchor="middle">
              {c}
            </text>
            <text x="105" y={185 - c * 94} textAnchor="end">
              {c}
            </text>
          </g>
        ))}
      </g>
      <text x="445" y="185" className="axis-caption">
        x
      </text>
      <text x="255" y="30" className="axis-caption">
        y
      </text>
      {measurements.map((m) => (
        <g
          key={m.entityId}
          role="button"
          tabIndex={0}
          aria-label={`Select ${m.entityId}: ${m.value ?? 'Missing'}`}
          aria-pressed={selectedId === m.entityId}
          onClick={() => onSelect(m.entityId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(m.entityId)
            }
          }}
          className="slice-sample"
        >
          <rect
            x={260 + m.coordinates[0] * 94 - 38}
            y={180 - m.coordinates[1] * 94 - 38}
            width="76"
            height="76"
            rx="3"
            fill={fieldColor(m.value, frame.field.domain)}
            stroke={selectedId === m.entityId ? 'var(--foreground)' : 'var(--border)'}
            strokeWidth={selectedId === m.entityId ? 3 : 1}
          />
          <text
            x={260 + m.coordinates[0] * 94}
            y={185 - m.coordinates[1] * 94}
            textAnchor="middle"
            fill={m.value === null ? 'var(--foreground)' : m.value >= 0.5 ? '#14191d' : '#ffffff'}
          >
            {m.value === null ? 'Missing' : m.value.toFixed(3)}
          </text>
          {selectedId === m.entityId ? (
            <text
              x={260 + m.coordinates[0] * 94}
              y={211 - m.coordinates[1] * 94}
              textAnchor="middle"
              fill={m.value === null ? 'var(--foreground)' : m.value >= 0.5 ? '#14191d' : '#ffffff'}
              className="sample-id"
            >
              {m.entityId}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  )
}

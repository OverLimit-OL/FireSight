import { useId } from 'react'
import { apparatus } from './apparatus'
export default function ApparatusSection({
  selected,
  onSelect,
  step,
  visible = true,
  annotations = true,
  overlays = true,
  combustion = true,
}: {
  selected: string
  onSelect: (id: string) => void
  step: number
  visible?: boolean
  annotations?: boolean
  overlays?: boolean
  combustion?: boolean
}) {
  const id = useId()
  return (
    <svg
      className="apparatus-section"
      viewBox="0 0 800 460"
      role="group"
      aria-label="Schematic orthographic section of the combustion flow tunnel"
    >
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#ffdba1" />
          <stop offset="1" stopColor="#d85f2f" />
        </linearGradient>
      </defs>
      <g stroke="#35505f" strokeWidth="1">
        {Array.from({ length: 17 }, (_, i) => (
          <line key={i} x1={i * 50} x2={i * 50} y1="30" y2="410" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="0" x2="800" y1={50 + i * 50} y2={50 + i * 50} />
        ))}
      </g>
      {[
        ...apparatus.filter((c) => c.id === 'chamber'),
        ...apparatus.filter((c) => c.id !== 'chamber'),
      ]
        .filter(
          (c) =>
            (visible || ['sample', 'flame'].includes(c.id)) && (combustion || c.id !== 'flame'),
        )
        .map((c) => (
          <g
            key={c.id}
            role="button"
            tabIndex={0}
            aria-label={`Select ${c.name}`}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(c.id)
              }
            }}
            stroke={selected === c.id ? '#ffc88b' : '#9cb4c0'}
            strokeWidth={selected === c.id ? 3 : 1.5}
          >
            {c.id === 'chamber' && visible ? (
              <>
                <rect x="115" y="90" width="570" height="260" rx="4" fill="#233946" />
                <rect x="105" y="350" width="590" height="18" fill="#718792" />
              </>
            ) : null}
            {c.id === 'holder' && visible ? (
              <path d="M340 340V285H460V340M325 340H475" fill="none" strokeWidth="12" />
            ) : null}
            {c.id === 'sample' ? (
              <rect x="345" y="270" width="110" height="12" fill="#c7bba1" />
            ) : null}
            {c.id === 'inlet' && visible ? (
              <>
                <rect x="115" y="90" width="20" height="260" fill="#526e7e" />
                {[130, 165, 200, 235, 270, 305].map((y) => (
                  <path key={y} d={`M75 ${y}H205l-12 -6m12 6l-12 6`} fill="none" />
                ))}
              </>
            ) : null}
            {c.id === 'camera' && visible ? (
              <>
                <path d="M565 340V270" />
                <rect x="540" y="240" width="58" height="35" fill="#334f60" />
                <path d="M540 245L520 235V280L540 270" fill="#152733" />
              </>
            ) : null}
            {c.id === 'camera' && visible ? (
              <rect x={520} y={235} width={80} height={110} fill="transparent" stroke="none" />
            ) : null}
            {c.id === 'holder' && visible ? (
              <rect x={325} y={280} width={150} height={65} fill="transparent" stroke="none" />
            ) : null}
            {c.id === 'flame' && combustion ? (
              <path
                d={`M350 269C320 230 370 ${165 - step * 3} 407 ${130 + step * 2}C390 210 485 205 450 269Z`}
                fill={`url(#${id})`}
                opacity="0.9"
              />
            ) : null}
          </g>
        ))}
      {annotations ? (
        <g pointerEvents="none" fill="#d9e6ea" fontSize="14" fontFamily="IBM Plex Mono, monospace">
          <text x="140" y="70">
            TEST REGION · SCHEMATIC
          </text>
          <text x="340" y="395">
            SOLID SAMPLE
          </text>
          <text x="528" y="310">
            OPTICAL ACCESS
          </text>
          <text x="26" y="330">
            INLET
          </text>
        </g>
      ) : null}
      {overlays ? (
        <g pointerEvents="none" stroke="#91c2cf" fill="#91c2cf" fontSize="13">
          <path d="M40 420H110m-8 -5l8 5 -8 5M40 420V370m-5 8l5 -8 5 8" />
          <text x="120" y="425">
            x
          </text>
          <text x="35" y="360">
            y
          </text>
          <text x="500" y="425">
            Conceptual flow →
          </text>
        </g>
      ) : null}
    </svg>
  )
}

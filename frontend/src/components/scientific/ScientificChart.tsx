import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Dataset, DatasetRow, VisualizationDefinition } from '@/types/research'

export default function ScientificChart({
  dataset,
  rows,
  view,
  selected,
  select,
}: {
  dataset: Dataset
  rows: DatasetRow[]
  view: VisualizationDefinition
  selected: string[]
  select: (id: string) => void
}) {
  const xId = view.xVariableId ?? 'index'
  const xUnit = dataset.variables.find((v) => v.id === xId)?.unit ?? 'unit not reported'
  const yVariables = dataset.variables.filter((v) => view.yVariableIds.includes(v.id))
  const unitsMatch =
    yVariables.length < 2 ||
    yVariables.every((v) => v.unit !== null && v.unit === yVariables[0]?.unit)
  const xLabel = dataset.variables.find((v) => v.id === xId)?.label ?? xId
  const points = rows
    .map((r) => ({ id: r.id, ...r.values }))
    .filter((r) => typeof r[xId as keyof typeof r] === 'number')
  const colors = ['var(--chart-1)', 'var(--chart-2)']
  const picked = rows.find((r) => selected.includes(r.id))
  if (!unitsMatch)
    return (
      <p role="status">
        These series have incompatible or unknown units. Select one signal or use the sample table;
        no numerical overlay is shown.
      </p>
    )
  const common = (
    <>
      <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
      <XAxis
        dataKey={view.type === 'scatter' ? 'x' : xId}
        type="number"
        domain={view.axisDomain.x ?? ['dataMin', 'dataMax']}
        allowDataOverflow
        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        label={{
          value: `${xLabel} (${xUnit})`,
          position: 'insideBottom',
          offset: -14,
          fill: 'var(--muted-foreground)',
          fontSize: 12,
        }}
      />
      <YAxis
        dataKey={view.type === 'scatter' ? 'y' : undefined}
        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        width={42}
        tickLine={false}
        axisLine={false}
        domain={['auto', 'auto']}
      />
      <Tooltip
        contentStyle={{
          background: 'var(--popover)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          borderRadius: 4,
          fontSize: 13,
        }}
        labelFormatter={(label) => `${xLabel}: ${label}`}
      />
      <Legend
        verticalAlign="top"
        height={38}
        iconType="plainline"
        wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }}
      />
      {picked && typeof picked.values[xId] === 'number' ? (
        <ReferenceLine
          x={picked.values[xId]}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
        />
      ) : null}
    </>
  )
  return (
    <div
      className="scientific-chart"
      role="img"
      aria-label={`${dataset.origin === 'synthetic' ? 'Synthetic demonstration. ' : ''}${view.yVariableIds.join(' and ')} by ${xLabel}. Use the sample table below for exact values and keyboard inspection.`}
    >
      <div className="chart-axis-caption">
        {yVariables.map((v) => `${v.label} · ${v.unit ?? 'unit not reported'}`).join(' / ')}
      </div>
      <ResponsiveContainer width="100%" height={310} minWidth={0}>
        {view.type === 'scatter' ? (
          <ScatterChart margin={{ top: 4, right: 20, bottom: 28, left: 0 }}>
            {common}
            {view.yVariableIds.map((id, i) => (
              <Scatter
                key={id}
                data={rows
                  .map((r) => ({ id: r.id, x: r.values[xId], y: r.values[id] }))
                  .filter((p) => typeof p.x === 'number' && typeof p.y === 'number')}
                name={dataset.variables.find((v) => v.id === id)?.label ?? id}
                fill={colors[i % 2]}
                shape={i === 0 ? 'circle' : 'square'}
                onClick={(point) => {
                  const payload: unknown = point.payload
                  if (
                    typeof payload === 'object' &&
                    payload !== null &&
                    'id' in payload &&
                    typeof payload.id === 'string'
                  )
                    select(payload.id)
                }}
              />
            ))}
          </ScatterChart>
        ) : (
          <LineChart
            data={points}
            margin={{ top: 4, right: 20, bottom: 28, left: 0 }}
            onClick={(state) => {
              const i = Number(state.activeTooltipIndex)
              if (Number.isInteger(i) && points[i]) select(points[i].id)
            }}
          >
            {common}
            {view.yVariableIds.map((id, i) => (
              <Line
                key={id}
                type="linear"
                dataKey={id}
                name={dataset.variables.find((v) => v.id === id)?.label ?? id}
                stroke={colors[i % 2]}
                strokeWidth={2}
                strokeDasharray={i ? '5 4' : undefined}
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

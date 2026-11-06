import { lazy, Suspense, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, FlaskConical, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '@/app/data'
import { emptyView } from '@/types/research'
import type { Dataset, DatasetRow, LabSession, VisualizationDefinition } from '@/types/research'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ConfirmAction, EmptyState, ErrorState, Loading } from '@/components/shared'
const ScientificChart = lazy(() => import('@/components/scientific/ScientificChart'))
export default function LabStage({
  session,
  setSession,
  dataset,
  rows,
  patchView,
}: {
  session: LabSession
  setSession: Dispatch<SetStateAction<LabSession>>
  dataset: UseQueryResult<Dataset, Error>
  rows: UseQueryResult<DatasetRow[], Error>
  patchView: (v: Partial<VisualizationDefinition>) => void
}) {
  const [tableOpen, setTableOpen] = useState(false)
  const visualization = session.visualization
  const datasetId = session.context.datasetIds[0] ?? ''
  const viewReady =
    dataset.data?.variables.some((v) => v.id === visualization.xVariableId) &&
    visualization.yVariableIds.length > 0 &&
    visualization.yVariableIds.every((id) => dataset.data?.variables.some((v) => v.id === id))
  const selectedRow = rows.data?.find((r) => session.selectedRowIds.includes(r.id))
  return (
    <section className="lab-stage" aria-labelledby="visualization-title">
      <div className="stage-header">
        <div>
          <p className="eyebrow">Visualization</p>
          <h2 id="visualization-title">{dataset.data?.title ?? 'Your data, in context'}</h2>
        </div>
        {dataset.data ? (
          <ToggleGroup
            type="single"
            aria-label="Visualization type"
            value={visualization.type}
            onValueChange={(value) => {
              if (value === 'line' || value === 'scatter' || value === 'table')
                patchView({ type: value })
            }}
          >
            <ToggleGroupItem value="line">Line</ToggleGroupItem>
            <ToggleGroupItem value="scatter">Scatter</ToggleGroupItem>
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
          </ToggleGroup>
        ) : (
          <FlaskConical aria-hidden="true" />
        )}
      </div>
      {(datasetId && dataset.isPending) || (rows.isPending && !!datasetId) ? (
        <Loading label="Loading dataset…" />
      ) : dataset.isError || rows.isError ? (
        <ErrorState
          error={dataset.error ?? rows.error}
          retry={() => {
            void dataset.refetch()
            void rows.refetch()
          }}
        />
      ) : !dataset.data ? (
        <div className="lab-empty">
          <div className="empty-plot" aria-hidden="true">
            <span />
            <Activity />
          </div>
          <EmptyState
            title="Select data to inspect"
            description={
              session.context.studyIds.length
                ? 'Study context is saved in this view. No experimental measurements are connected.'
                : 'Bring a study from the library, or explore the controls with an explicitly synthetic example.'
            }
          >
            {api.mode === 'demo' ? (
              <ConfirmAction
                title="Load a synthetic example?"
                description="These generated, dimensionless signals demonstrate chart interactions. They are unrelated to NASA experiments and have no physical interpretation."
                actionLabel="Use synthetic example"
                trigger={
                  <Button variant="outline">
                    Load synthetic example
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                }
                onConfirm={() => {
                  setSession((s) => ({
                    ...s,
                    context: { ...s.context, datasetIds: ['synthetic-traces'] },
                    visualization: {
                      ...emptyView(),
                      xVariableId: 'index',
                      yVariableIds: ['a', 'b'],
                    },
                  }))
                }}
              />
            ) : (
              <Button variant="outline" asChild>
                <Link to="/resources">Browse study context</Link>
              </Button>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="synthetic-label">
            {dataset.data.origin === 'synthetic'
              ? 'Synthetic demonstration · no physical interpretation'
              : 'Source dataset · review provenance and limitations'}
          </div>
          {visualization.type !== 'table' && !viewReady ? (
            <EmptyState
              title="Choose variables to plot"
              description="Select available horizontal and dependent variables. The sample table remains available below."
            />
          ) : visualization.type !== 'table' ? (
            <Suspense fallback={<Loading label="Preparing visualization…" />}>
              <ScientificChart
                dataset={dataset.data}
                rows={rows.data ?? []}
                view={visualization}
                selected={session.selectedRowIds}
                select={(id) => setSession((s) => ({ ...s, selectedRowIds: [id] }))}
              />
            </Suspense>
          ) : null}
          <div className="chart-toolbar">
            <div className="actions">
              <Button
                variant="outline"
                size="icon"
                aria-label="Zoom in"
                onClick={() => {
                  const values = (rows.data ?? [])
                    .map((r) => r.values[visualization.xVariableId ?? 'index'])
                    .filter((v): v is number => typeof v === 'number')
                  const domain = visualization.axisDomain.x ?? [
                    Math.min(...values),
                    Math.max(...values),
                  ]
                  const trim = (domain[1] - domain[0]) * 0.15
                  if (trim > 0.01)
                    patchView({
                      axisDomain: {
                        ...visualization.axisDomain,
                        x: [domain[0] + trim, domain[1] - trim],
                      },
                    })
                }}
              >
                <ZoomIn />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Zoom out"
                onClick={() => patchView({ axisDomain: { x: null, y: null } })}
              >
                <ZoomOut />
              </Button>
              <Button
                variant="ghost"
                onClick={() => patchView({ axisDomain: { x: null, y: null } })}
              >
                Reset zoom
              </Button>
            </div>
            <span className="small-label">Null values remain gaps</span>
          </div>
          <div className="sample-inspector">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sample-select">Inspect a sample</FieldLabel>
                <NativeSelect
                  id="sample-select"
                  value={session.selectedRowIds[0] ?? ''}
                  onChange={(e) =>
                    setSession((s) => ({
                      ...s,
                      selectedRowIds: e.target.value ? [e.target.value] : [],
                    }))
                  }
                >
                  <NativeSelectOption value="">Select a sample…</NativeSelectOption>
                  {rows.data?.map((row) => (
                    <NativeSelectOption value={row.id} key={row.id}>
                      {row.id}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            {selectedRow ? (
              <p role="status" className="mono">
                {Object.entries(selectedRow.values)
                  .map(([k, v]) => `${k}: ${v ?? 'missing'}`)
                  .join(' · ')}
                <br />
                <span className="muted">
                  {dataset.data?.origin === 'synthetic'
                    ? 'Dimensionless synthetic values'
                    : 'Reported values; review dataset units'}
                </span>
              </p>
            ) : (
              <p className="muted small-copy">Choose a sample to see its exact values.</p>
            )}
          </div>
          {visualization.type !== 'table' ? (
            <Button
              className="table-toggle"
              variant="ghost"
              onClick={() => setTableOpen((v) => !v)}
              aria-expanded={tableOpen}
            >
              {tableOpen ? 'Hide sample table' : 'Show accessible sample table'}
            </Button>
          ) : (
            <h3 className="sample-table-title">Sample table</h3>
          )}
          {tableOpen || visualization.type === 'table' ? (
            <div
              className="table-scroll sample-table"
              tabIndex={0}
              role="region"
              aria-label="Dataset sample values"
            >
              <table>
                <caption>
                  {dataset.data.origin === 'synthetic'
                    ? 'Synthetic demonstration · dimensionless values · no physical interpretation'
                    : dataset.data.title}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Sample</th>
                    {dataset.data.variables.map((v) => (
                      <th scope="col" key={v.id}>
                        {v.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.data?.map((row) => (
                    <tr
                      key={row.id}
                      className={session.selectedRowIds.includes(row.id) ? 'selected-sample' : ''}
                    >
                      <th scope="row">
                        <button
                          onClick={() => setSession((s) => ({ ...s, selectedRowIds: [row.id] }))}
                        >
                          {row.id}
                        </button>
                      </th>
                      {dataset.data!.variables.map((v) => (
                        <td key={v.id}>{row.values[v.id] ?? 'Missing'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

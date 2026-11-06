import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen, Database, RotateCcw } from 'lucide-react'
import { api } from '@/app/data'
import { emptyContext, emptyView } from '@/types/research'
import type { Dataset, LabSession, VisualizationDefinition } from '@/types/research'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ConfirmAction } from '@/components/shared'
function StudyContext({ id }: { id: string }) {
  const query = useQuery({ queryKey: [api.mode, 'study', id], queryFn: () => api.getStudy(id) })
  return (
    <Link className="lab-study-context" to={`/resources/${id}`}>
      <BookOpen aria-hidden="true" />
      <span>
        {query.data?.investigation ?? id}
        <small>
          {query.isError
            ? 'Study unavailable · context retained'
            : 'Study context · no measurements'}
        </small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  )
}
export default function LabControls({
  session,
  setSession,
  dataset,
  patchView,
}: {
  session: LabSession
  setSession: Dispatch<SetStateAction<LabSession>>
  dataset: Dataset | undefined
  patchView: (v: Partial<VisualizationDefinition>) => void
}) {
  const [selectionError, setSelectionError] = useState('')
  const contextStudies = useQueries({
    queries: session.context.studyIds.map((id) => ({
      queryKey: [api.mode, 'study', id],
      queryFn: () => api.getStudy(id),
    })),
  })
  const availableIds = [
    ...new Set([
      ...session.context.datasetIds,
      ...contextStudies.flatMap((q) => q.data?.datasetIds ?? []),
    ]),
  ]
  const datasetId = session.context.datasetIds[0] ?? ''
  const visualization = session.visualization
  return (
    <aside className="lab-controls">
      <div className="section-heading">
        <h2>Research context</h2>
        <Database aria-hidden="true" />
      </div>
      {session.context.studyIds.length ? (
        session.context.studyIds.map((id) => <StudyContext key={id} id={id} />)
      ) : (
        <p className="muted small-copy">
          No study attached. Add an investigation from the research library.
        </p>
      )}
      <Link className="quiet-link" to="/resources">
        Choose a study
        <ArrowRight aria-hidden="true" />
      </Link>
      <div className="lab-control-divider" />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dataset-picker">Dataset</FieldLabel>
          <NativeSelect
            id="dataset-picker"
            disabled={!availableIds.length}
            value={datasetId}
            onChange={async (e) => {
              const id = e.target.value
              setSelectionError('')
              if (!id) {
                setSession((s) => ({
                  ...s,
                  context: { ...s.context, datasetIds: [] },
                  visualization: emptyView(),
                  selectedRowIds: [],
                }))
                return
              }
              try {
                const chosen = await api.getDataset(id)
                const numeric = chosen.variables.filter((v) => v.kind === 'number')
                const x = numeric.find((v) => v.role === 'independent') ?? numeric[0]
                const y = numeric
                  .filter((v) => v.role === 'dependent' && v.id !== x?.id)
                  .slice(0, 1)
                setSession((s) => ({
                  ...s,
                  context: { ...s.context, datasetIds: [id] },
                  visualization: {
                    ...emptyView(),
                    xVariableId: x?.id ?? null,
                    yVariableIds: y.map((v) => v.id),
                  },
                  selectedRowIds: [],
                }))
              } catch (error) {
                setSelectionError(
                  error instanceof Error
                    ? error.message
                    : 'Dataset selection failed. Study context is preserved.',
                )
              }
            }}
          >
            <NativeSelectOption value="">No dataset selected</NativeSelectOption>
            {availableIds.map((id) => (
              <NativeSelectOption key={id} value={id}>
                {id === datasetId ? (dataset?.title ?? id) : id}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field data-disabled={!dataset}>
          <FieldLabel htmlFor="x-variable">Horizontal axis</FieldLabel>
          <NativeSelect
            id="x-variable"
            disabled={!dataset}
            value={visualization.xVariableId ?? ''}
            onChange={(e) =>
              patchView({ xVariableId: e.target.value, axisDomain: { x: null, y: null } })
            }
          >
            {dataset ? <NativeSelectOption value="">Choose a variable…</NativeSelectOption> : null}
            {!dataset ? (
              <NativeSelectOption value="">Select data first</NativeSelectOption>
            ) : (
              dataset.variables
                .filter((v) => v.kind === 'number')
                .map((v) => (
                  <NativeSelectOption key={v.id} value={v.id}>
                    {v.label}
                  </NativeSelectOption>
                ))
            )}
          </NativeSelect>
        </Field>
        <Field data-disabled={!dataset}>
          <FieldLabel htmlFor="y-variable">Signals to compare</FieldLabel>
          <NativeSelect
            id="y-variable"
            disabled={!dataset}
            value={
              visualization.yVariableIds.length > 1 ? 'both' : (visualization.yVariableIds[0] ?? '')
            }
            onChange={(e) =>
              patchView({
                yVariableIds:
                  e.target.value === 'both'
                    ? (dataset?.variables
                        .filter((v) => v.role === 'dependent' && v.kind === 'number')
                        .map((v) => v.id)
                        .slice(0, 2) ?? [])
                    : [e.target.value],
              })
            }
          >
            {dataset ? <NativeSelectOption value="">Choose a signal…</NativeSelectOption> : null}
            {!dataset ? (
              <NativeSelectOption value="">Select data first</NativeSelectOption>
            ) : (
              <>
                {dataset.variables
                  .filter((v) => v.role === 'dependent')
                  .map((v) => (
                    <NativeSelectOption key={v.id} value={v.id}>
                      {v.label}
                    </NativeSelectOption>
                  ))}
                {dataset.variables.filter((v) => v.role === 'dependent' && v.kind === 'number')
                  .length >= 2 ? (
                  <NativeSelectOption value="both">Compare first two signals</NativeSelectOption>
                ) : null}
              </>
            )}
          </NativeSelect>
        </Field>
      </FieldGroup>
      {selectionError ? (
        <p role="alert" className="error-text">
          {selectionError}
        </p>
      ) : null}
      <div className="lab-reset-actions">
        <Button
          variant="ghost"
          disabled={!dataset}
          onClick={() => {
            patchView({ axisDomain: { x: null, y: null } })
            setSession((s) => ({ ...s, selectedRowIds: [] }))
          }}
        >
          <RotateCcw data-icon="inline-start" />
          Reset view
        </Button>
        <ConfirmAction
          title="Reset this workspace?"
          description="This clears the working datasets, study context, selections and notes. Your saved workspace is unchanged until you save again."
          actionLabel="Reset workspace"
          trigger={<Button variant="ghost">Reset workspace…</Button>}
          onConfirm={() =>
            setSession((s) => ({
              ...s,
              context: emptyContext(),
              visualization: emptyView(),
              selectedRowIds: [],
              notes: '',
            }))
          }
        />
      </div>
    </aside>
  )
}

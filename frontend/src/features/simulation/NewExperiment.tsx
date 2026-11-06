import ExperimentViewport from './viewport/ExperimentViewport'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, FlaskConical } from 'lucide-react'
import { simulationApi, simulationKeys } from '@/services/simulation'
import { queryClient } from '@/app/data'
import type { ExperimentConfiguration } from '@/types/simulation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ErrorState, Loading, PageHeading } from '@/components/shared'
export default function NewExperiment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const models = useQuery({
    queryKey: simulationKeys.models,
    queryFn: ({ signal }) => simulationApi.listModels(signal),
  })
  const [selectedComponent, setSelectedComponent] = useState(params.get('component') ?? 'sample')
  const [researchContext, setResearchContext] = useState(params.get('study') ?? '')
  const [modelId, setModelId] = useState(params.get('model') ?? '')
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('Untitled experiment')
  const [configuration, setConfiguration] = useState<ExperimentConfiguration>({
    sequenceId: 'reference',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const model = modelId ? models.data?.find((m) => m.id === modelId) : models.data?.[0]
  async function create() {
    if (!model || !title.trim()) {
      setError('Enter an experiment title.')
      document.getElementById('experiment-title')?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await simulationApi.createSession({
        title: title.trim(),
        modelId: model.id,
        modelVersion: model.version,
        configuration,
        studyIds: researchContext ? [researchContext] : [],
      })
      await queryClient.invalidateQueries({ queryKey: simulationKeys.sessions })
      navigate(
        `/lab/studio/${saved.id}?entity=${encodeURIComponent(selectedComponent)}&view=${params.get('view') === 'slice' ? 'slice' : 'points'}`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create experiment.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page experiment-creation">
      <Link className="quiet-link back-link" to="/lab">
        <ArrowLeft aria-hidden="true" />
        Research Lab
      </Link>
      <PageHeading
        label="New Experiment"
        title="Begin with a supported model"
        description="Define the scope before you inspect the result. Creating a workspace does not run a computation."
      />
      <ol className="creation-steps" aria-label="Experiment creation progress">
        {['Model & context', 'Configuration', 'Review & create'].map((label, i) => (
          <li key={label} aria-current={step === i ? 'step' : undefined}>
            <span>{i < step ? <Check aria-hidden="true" /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {models.isPending ? (
        <Loading label="Loading supported models…" />
      ) : models.isError ? (
        <ErrorState error={models.error} retry={() => models.refetch()} />
      ) : !model ? (
        <div className="missing-field">
          <h2>No model is connected</h2>
          <p>
            A new computational experiment needs an identified model and declared capabilities.
            Continue with a data notebook or connect the Flask model catalog.
          </p>
          <Button asChild variant="outline">
            <Link to="/lab?notebook=1">Open data notebook</Link>
          </Button>
        </div>
      ) : (
        <form
          className="creation-body"
          onSubmit={(e) => {
            e.preventDefault()
            if (step < 2) setStep(step + 1)
            else void create()
          }}
        >
          <div className="creation-main">
            {step === 0 ? (
              <>
                <p className="eyebrow">Model family</p>
                <h2>Choose what can be evaluated</h2>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="simulation-model">Available model</FieldLabel>
                    <NativeSelect
                      id="simulation-model"
                      name="model"
                      value={model.id}
                      onChange={(e) => {
                        setModelId(e.target.value)
                        const selected = models.data.find((m) => m.id === e.target.value)
                        if (selected) setConfiguration(selected.defaults)
                      }}
                    >
                      {models.data.map((m) => (
                        <NativeSelectOption key={m.id} value={m.id}>
                          {m.title} · v{m.version}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldDescription>{model.description}</FieldDescription>
                  </Field>
                </FieldGroup>
                <Badge variant="outline">
                  {model.origin === 'illustrative'
                    ? 'Illustrative / Not Scientifically Validated'
                    : 'Unverified model · review provenance'}
                </Badge>
                {params.getAll('study').length ? (
                  <div className="missing-field">
                    Research reference: {params.getAll('study').join(', ').toUpperCase()}. This
                    context is retained, but the selected example does not reconstruct that
                    investigation.
                  </div>
                ) : (
                  <label className="research-context-choice">
                    Research context
                    <NativeSelect
                      aria-label="Research context"
                      value={researchContext}
                      onChange={(e) => setResearchContext(e.target.value)}
                    >
                      <NativeSelectOption value="">Independent experiment</NativeSelectOption>
                      <NativeSelectOption value="bass">
                        BASS · contextual reference only
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                )}
              </>
            ) : step === 1 ? (
              <>
                <p className="eyebrow">Editable inputs</p>
                <h2>Define this configuration</h2>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="experiment-title">Experiment title</FieldLabel>
                    <Input
                      id="experiment-title"
                      name="experimentTitle"
                      autoComplete="off"
                      maxLength={120}
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fixture-sequence">Demonstration sequence</FieldLabel>
                    <NativeSelect
                      id="fixture-sequence"
                      name="sequenceId"
                      value={configuration.sequenceId}
                      onChange={(e) =>
                        setConfiguration({
                          sequenceId: e.target.value as ExperimentConfiguration['sequenceId'],
                        })
                      }
                    >
                      {model.inputs[0].options.map((o) => (
                        <NativeSelectOption key={o.value} value={o.value}>
                          {o.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldDescription>
                      Selects one of two authored fixture bundles. No physical parameter is being
                      changed.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfiguration(model.defaults)}
                >
                  Restore defaults
                </Button>
              </>
            ) : (
              <>
                <p className="eyebrow">Applicability review</p>
                <h2>{title}</h2>
                <dl className="review-register">
                  <div>
                    <dt>Model</dt>
                    <dd>
                      {model.title} · v{model.version}
                    </dd>
                  </div>
                  <div>
                    <dt>Configuration</dt>
                    <dd>{configuration.sequenceId} sequence</dd>
                  </div>
                  <div>
                    <dt>Output</dt>
                    <dd>Schematic apparatus + authored scalar samples</dd>
                  </div>
                  <div>
                    <dt>Scientific validation</dt>
                    <dd>Unavailable · illustrative only</dd>
                  </div>
                </dl>
                <h3>Known limitations</h3>
                <ul className="limitation-list">
                  {model.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <p className="muted">
                  Saved on {simulationApi.mode === 'demo' ? 'this device' : 'the connected API'}.
                  Loading the selected sequence is a separate action in the Studio.
                </p>
              </>
            )}
            {error ? (
              <p className="error-text" role="alert">
                {error}
              </p>
            ) : null}
            <div className="creation-footer">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft data-icon="inline-start" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={busy} type="submit">
                {busy ? 'Creating…' : step < 2 ? 'Continue' : 'Create experiment'}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
          <aside className="creation-aside">
            <ExperimentViewport selected={selectedComponent} onSelect={setSelectedComponent} />
            <FlaskConical aria-hidden="true" />
            <h3>Keep the limits visible.</h3>
            <p>
              This model demonstrates configuration, playback and traceability. It contains no
              combustion solver, NASA measurements or safety predictions.
            </p>
            <p>Every run will remain tied to its original configuration.</p>
          </aside>
        </form>
      )}
    </div>
  )
}

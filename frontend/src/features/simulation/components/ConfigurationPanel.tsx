import { modelParameterProfile } from '../viewport/modelParameters'
import ParameterControls from './ParameterControls'
import type { SceneSettings } from '../viewport/sceneSettings'
import type {
  ExperimentConfiguration,
  SimulationModel,
  SimulationSession,
} from '@/types/simulation'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
export default function ConfigurationPanel({
  session,
  model,
  title,
  onTitle,
  notes,
  onNotes,
  configuration,
  onConfiguration,
  dirty,
  busy,
  onSave,
  outcome,
  onOutcome,
  sceneSettings,
  onSceneSettings,
}: {
  session: SimulationSession
  model: SimulationModel
  title: string
  onTitle: (v: string) => void
  notes: string
  onNotes: (v: string) => void
  configuration: ExperimentConfiguration
  onConfiguration: (v: ExperimentConfiguration) => void
  dirty: boolean
  busy: boolean
  onSave: () => void
  outcome: 'complete' | 'fail'
  onOutcome: (v: 'complete' | 'fail') => void
  sceneSettings: SceneSettings
  onSceneSettings: (settings: SceneSettings) => void
}) {
  const capabilities = modelParameterProfile(model).parameters
  const current = session.revisions.at(-1)!
  return (
    <aside className="studio-configuration" aria-label="Experiment configuration">
      <div className="panel-heading">
        <h2>Configuration</h2>
        <span className="mono">r{current.number}</span>
      </div>
      <details open className="config-section">
        <summary>Session & demonstration</summary>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="studio-title">Experiment title</FieldLabel>
            <Input
              id="studio-title"
              name="experimentTitle"
              autoComplete="off"
              value={title}
              maxLength={120}
              onChange={(e) => onTitle(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="studio-sequence">Demonstration configuration</FieldLabel>
            <NativeSelect
              id="studio-sequence"
              name="sequenceId"
              value={configuration.sequenceId}
              onChange={(e) =>
                onConfiguration({
                  sequenceId: e.target.value as ExperimentConfiguration['sequenceId'],
                })
              }
            >
              {model.inputs[0].options.map((o) => (
                <NativeSelectOption key={o.value} value={o.value}>
                  {o.value === 'reference' ? 'Baseline observation' : 'Alternative observation'}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>
              Authored observations only. Saving creates a revision; loading produces no physical
              calculation.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <div className="configuration-actions">
          <Button disabled={busy} variant="outline" onClick={onSave}>
            {busy ? 'Saving…' : dirty ? 'Save configuration' : 'Save experiment'}
          </Button>
          <Button variant="ghost" onClick={() => onConfiguration(model.defaults)}>
            Restore defaults
          </Button>
        </div>
      </details>
      <details open className="config-section">
        <summary>Visualization</summary>
        <ParameterControls
          capabilities={capabilities}
          group="visualization"
          settings={sceneSettings}
          onChange={onSceneSettings}
        />
      </details>
      <details className="config-section">
        <summary>Scientific parameters</summary>
        <ParameterControls
          capabilities={capabilities}
          group="engine"
          settings={sceneSettings}
          onChange={onSceneSettings}
        />
      </details>
      <details className="config-section">
        <summary>Unsupported conditions</summary>
        <ParameterControls
          capabilities={capabilities}
          group="unsupported"
          settings={sceneSettings}
          onChange={onSceneSettings}
        />
      </details>
      <details className="config-section">
        <summary>Model & applicability</summary>
        <dl className="config-register">
          <div>
            <dt>Model</dt>
            <dd>{model.title}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd className="mono">{model.version}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>Fire-XII authored fixture</dd>
          </div>
          <div>
            <dt>Applicability</dt>
            <dd>Interface demonstration only</dd>
          </div>
        </dl>
      </details>
      <details className="configuration-history">
        <summary>Configuration history · {session.revisions.length}</summary>
        <ol>
          {session.revisions.map((r) => (
            <li key={r.id}>
              <strong>r{r.number}</strong> · {r.configuration.sequenceId}{' '}
              <Button size="sm" variant="ghost" onClick={() => onConfiguration(r.configuration)}>
                Restore r{r.number}
              </Button>
              <small className="mono" title={r.configurationDigest}>
                {r.configurationDigest.slice(0, 12)}
              </small>
            </li>
          ))}
        </ol>
      </details>
      <details className="config-section">
        <summary>Research notes</summary>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="simulation-notes">Research notes</FieldLabel>
            <Textarea
              id="simulation-notes"
              name="simulationNotes"
              value={notes}
              maxLength={20000}
              rows={4}
              onChange={(e) => onNotes(e.target.value)}
              placeholder="Record a question or next step…"
            />
            <FieldDescription>User-authored; saved with this experiment.</FieldDescription>
          </Field>
        </FieldGroup>
      </details>
      <details className="demo-controls">
        <summary>Demonstration controls</summary>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="run-outcome">Next fixture load</FieldLabel>
            <NativeSelect
              id="run-outcome"
              name="demoOutcome"
              value={outcome}
              onChange={(e) => onOutcome(e.target.value as 'complete' | 'fail')}
            >
              <NativeSelectOption value="complete">Complete normally</NativeSelectOption>
              <NativeSelectOption value="fail">Simulate a failed job</NativeSelectOption>
            </NativeSelect>
            <FieldDescription>
              Exercises error recovery. This does not change the scientific configuration.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </details>
    </aside>
  )
}

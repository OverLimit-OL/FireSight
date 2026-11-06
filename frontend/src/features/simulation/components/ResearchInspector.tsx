import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Focus, ArrowUpRight, BookOpen, Send } from 'lucide-react'
import { componentById } from '../viewport/apparatus'
import type {
  SimulationFrame,
  SimulationModel,
  SimulationRevision,
  SimulationRun,
  AIAnalysisContext,
} from '@/types/simulation'
import { readStored } from '@/lib/storage'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/shared'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
export type InspectorTab = 'selection' | 'copilot' | 'evidence'
const threadSchema = z.array(
  z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    context: z.object({
      modelId: z.string(),
      runId: z.string().nullable(),
      frameId: z.string().nullable(),
      selectedComponentId: z.string().nullable(),
      selectedEntityId: z.string().optional(),
      step: z.number().nullable(),
    }),
  }),
)
type CopilotTurn = z.infer<typeof threadSchema>[number]
type ContextSelection = CopilotTurn['context'] &
  Pick<AIAnalysisContext, 'modelId' | 'runId' | 'frameId'>
export default function ResearchInspector({
  model,
  run,
  revision,
  frame,
  selectedId,
  studyIds,
  busy,
  onAsk,
  onProposeView,
  tab: controlledTab,
  onTab,
  sessionId = 'preview',
  sessionTitle = 'Experiment',
  onFocus,
  compareRunId,
  visualization = 'points',
}: {
  model: SimulationModel
  run: SimulationRun | undefined
  revision: SimulationRevision | undefined
  frame: SimulationFrame | undefined
  selectedId: string
  studyIds: string[]
  busy: boolean
  onAsk: () => void
  onProposeView: () => void
  tab?: InspectorTab
  onTab?: (tab: InspectorTab) => void
  sessionId?: string
  sessionTitle?: string
  onFocus?: () => void
  compareRunId?: string
  visualization?: 'slice' | 'points' | 'table'
}) {
  const [localTab, setLocalTab] = useState<InspectorTab>('selection')
  const tab = controlledTab ?? localTab,
    changeTab = onTab ?? setLocalTab
  const [proposal, setProposal] = useState(false),
    [proposalBase, setProposalBase] = useState('')
  const component = componentById(selectedId),
    measurement = frame?.measurements.find((m) => m.entityId === selectedId)
  const base = `${run?.id}:${frame?.id}:${selectedId}`
  const researchTarget = (id: string) =>
    `/resources/${encodeURIComponent(id)}?view=interactive&component=${encodeURIComponent(selectedId)}&scene=${visualization === 'slice' ? 'slice' : 'points'}&lab=${encodeURIComponent(sessionId)}${run ? `&run=${encodeURIComponent(run.id)}` : ''}${frame ? `&frame=${encodeURIComponent(frame.id)}` : ''}`
  const threadKey = `firesight:copilot-thread:v1:${sessionId}`
  const [loaded] = useState(() => {
    try {
      return { messages: readStored(threadKey, threadSchema, []), error: '' }
    } catch {
      return {
        messages: [],
        error:
          'The local conversation could not be read. New messages remain available in this visit.',
      }
    }
  })
  const [messages, setMessages] = useState<CopilotTurn[]>(loaded.messages)
  const storageError = useDraftPersistence(threadKey, messages, !loaded.error)
  const thread = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight
  }, [messages.length, tab])
  const [question, setQuestion] = useState('')
  const context: ContextSelection = {
    modelId: model.id,
    runId: run?.id ?? null,
    frameId: frame?.id ?? null,
    selectedComponentId: component?.id ?? null,
    selectedEntityId: selectedId,
    step: frame?.coordinate.value ?? null,
  }
  function ask(text: string) {
    if (!text.trim()) return
    const answer =
      text === 'Explain selected component'
        ? (component?.role ??
          'This is an exact authored scalar sample. It is dimensionless and is not calibrated to a physical component.')
        : text === 'Explain this state'
          ? `At step ${context.step ?? 'preview'}, ${component?.name ?? selectedId} is selected. ${run ? `Run ${run.id.slice(0, 8)} is ${run.status}.` : 'No result has been loaded.'} The combustion envelope is an authored illustration. It is not derived from the scalar trace.`
          : text === 'What evidence is missing?'
            ? 'Recorded frames, calibrated geometry, physical boundary conditions and scientific validation are not connected. Available study references provide research context.'
            : `Your question is attached to ${component?.name ?? selectedId}, step ${context.step ?? 'preview'}, and this run. No inference service is connected, so this frontend cannot interpret the question. Continue in Research Chat to retain the same context.`
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: 'user', text: text.trim(), context },
      { id: crypto.randomUUID(), role: 'assistant', text: answer, context },
    ])
    setQuestion('')
  }
  return (
    <div className="research-inspector" data-tab={tab}>
      <div className="inspector-tabs" aria-label="Research panel">
        <Button
          variant="ghost"
          aria-pressed={tab === 'selection'}
          onClick={() => changeTab('selection')}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          aria-pressed={tab === 'copilot'}
          onClick={() => changeTab('copilot')}
        >
          Copilot
        </Button>
        <Button
          variant="ghost"
          aria-pressed={tab === 'evidence'}
          onClick={() => changeTab('evidence')}
        >
          Evidence
        </Button>
      </div>
      <div className="inspector-context-strip">
        <span>{component?.name ?? selectedId}</span>
        <span className="mono">{frame ? `STEP ${frame.coordinate.value}` : 'PREVIEW'}</span>
      </div>
      <div className="inspector-tab-content selection-content" hidden={tab !== 'selection'}>
        <p className="eyebrow">Selected object</p>
        <h3>{component?.name ?? measurement?.entityId ?? 'No selection'}</h3>
        <p>
          {component?.role ??
            'Exact authored sample. No physical measurement location is assigned.'}
        </p>
        <div className="selection-actions">
          <Button variant="outline" disabled={!component || !onFocus} onClick={onFocus}>
            <Focus aria-hidden="true" />
            Focus camera
          </Button>
          <Button
            onClick={() => {
              changeTab('copilot')
              ask('Explain selected component')
            }}
          >
            Ask AI about selection
          </Button>
        </div>
        <dl className="inspector-register">
          <div>
            <dt>Representation</dt>
            <dd>Schematic</dd>
          </div>
          <div>
            <dt>Source geometry</dt>
            <dd>Not connected</dd>
          </div>
          <div>
            <dt>Frame</dt>
            <dd>{frame?.coordinate.value ?? 'Preview'}</dd>
          </div>
          <div>
            <dt>Configuration</dt>
            <dd>{revision ? `r${revision.number}` : 'Draft'}</dd>
          </div>
        </dl>
        {measurement ? (
          <div className="selection-measurement">
            <p className="eyebrow">Authored scalar sample</p>
            <strong>{measurement.value ?? 'Missing'}</strong>
            <span>Dimensionless · ({measurement.coordinates.join(', ')})</span>
          </div>
        ) : (
          <p className="inspector-note">
            Apparatus objects and synthetic scalar samples are separate selections.
          </p>
        )}
        <h4>Linked research</h4>
        {studyIds.length ? (
          studyIds.map((id) => (
            <Link key={id} className="text-link" to={researchTarget(id)}>
              {id.toUpperCase()}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))
        ) : (
          <p className="muted">Independent session. No study is attached.</p>
        )}
        <Button variant="ghost" onClick={() => changeTab('evidence')}>
          <BookOpen aria-hidden="true" />
          Inspect provenance & limitations
        </Button>
      </div>
      <div className="inspector-tab-content copilot-content" hidden={tab !== 'copilot'}>
        <div className="copilot-session-context">
          <strong>{sessionTitle}</strong>
          <span>
            {model.title} · v{model.version}
          </span>
          <span>
            Run {run?.id.slice(0, 8) ?? 'not loaded'} · r{revision?.number ?? '—'}
            {compareRunId ? ` · comparison ${compareRunId.slice(0, 8)}` : ''}
          </span>
          {studyIds.length ? <span>References: {studyIds.join(', ').toUpperCase()}</span> : null}
        </div>
        <p className="copilot-demo-label">Demo conversation · no LLM connected</p>
        <div className="copilot-prompts">
          {['Explain selected component', 'Explain this state', 'What evidence is missing?'].map(
            (prompt) => (
              <Button key={prompt} variant="outline" onClick={() => ask(prompt)}>
                {prompt}
              </Button>
            ),
          )}
        </div>
        <div
          ref={thread}
          className="copilot-thread"
          role="log"
          tabIndex={0}
          aria-label="Local Copilot conversation"
          aria-live="polite"
        >
          {messages.length ? (
            messages.map((message) => (
              <article key={message.id} className={`copilot-turn ${message.role}`}>
                <span>{message.role === 'user' ? 'You' : 'Simulated Copilot response'}</span>
                <p>{message.text}</p>
                <small>
                  Step {message.context.step ?? 'preview'} ·{' '}
                  {message.context.selectedEntityId ??
                    message.context.selectedComponentId ??
                    'sample'}{' '}
                  · {message.context.runId?.slice(0, 8) ?? 'no run'}
                </small>
              </article>
            ))
          ) : (
            <div className="copilot-thread-empty">
              <p>Start with the selected state.</p>
              <span>Questions retain their object, frame and run context.</span>
            </div>
          )}
        </div>
        <form
          className="copilot-composer"
          onSubmit={(e) => {
            e.preventDefault()
            ask(question)
          }}
        >
          <label htmlFor="copilot-question" className="sr-only">
            Ask Copilot
          </label>
          <textarea
            id="copilot-question"
            name="copilotQuestion"
            rows={2}
            value={question}
            maxLength={4000}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the selected state…"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send contextual question"
            disabled={!question.trim()}
          >
            <Send aria-hidden="true" />
          </Button>
        </form>
        {loaded.error || storageError ? (
          <p role="status" className="error-text">
            {loaded.error || storageError}
          </p>
        ) : null}
        <Button disabled={busy} variant="ghost" onClick={onAsk}>
          {busy ? 'Capturing context…' : 'Continue in Research Chat'}
          <ArrowUpRight aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          disabled={!frame}
          onClick={() => {
            setProposalBase(base)
            setProposal(true)
          }}
        >
          Preview a demo suggestion
        </Button>
      </div>
      <div className="inspector-tab-content evidence-content" hidden={tab !== 'evidence'}>
        <p className="eyebrow">Model validity</p>
        <h3>Illustrative demonstration</h3>
        <p>
          This frontend has no scientific validation. Schematic geometry and authored observations
          do not support physical conclusions.
        </p>
        <dl className="inspector-register">
          <div>
            <dt>Model</dt>
            <dd>
              {model.title} v{model.version}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{run?.status ?? 'Not started'}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>r{revision?.number ?? '—'}</dd>
          </div>
          <div>
            <dt>Validation evidence</dt>
            <dd>Not available</dd>
          </div>
        </dl>
        {(run?.provenance ?? model.provenance).map((p) => (
          <div className="provenance-entry" key={p.id}>
            <strong>{p.title}</strong>
            <p>
              Revision {p.revision} · {p.origin}
            </p>
            {p.url ? (
              <ExternalLink url={p.url}>Open source</ExternalLink>
            ) : (
              <p>Local authored observations; no external data source.</p>
            )}
          </div>
        ))}
        <h4>Research references</h4>
        {studyIds.map((id) => (
          <Link key={id} className="text-link" to={researchTarget(id)}>
            {id.toUpperCase()} · open source record
          </Link>
        ))}
        <h4>Known limitations</h4>
        <ul className="limitation-list">
          {model.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      <Dialog open={proposal} onOpenChange={setProposal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review visualization suggestion</DialogTitle>
            <DialogDescription>
              Scripted interface suggestion: inspect the exact-sample table. This changes only the
              view.
            </DialogDescription>
          </DialogHeader>
          <p>Base step {frame?.coordinate.value}</p>
          {proposalBase !== base ? (
            <p role="alert">State changed. Request a new suggestion.</p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProposal(false)}>
              Cancel suggestion
            </Button>
            <Button
              disabled={proposalBase !== base}
              onClick={() => {
                onProposeView()
                setProposal(false)
              }}
            >
              Apply table view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

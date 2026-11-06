import { readWorkspaceMode, workspacePresets, type WorkspaceMode } from './workspacePresets'
import type { CSSProperties } from 'react'
import { usePreferences } from '@/app/Preferences'
import DockSplitter from './components/DockSplitter'
import { defaultSceneSettings, sceneSettingsSchema } from './viewport/sceneSettings'
import type { InspectorTab } from './components/ResearchInspector'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Copy,
  Fingerprint,
  FlaskConical,
  Play,
  Settings2,
  Square,
  PanelLeftClose,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { z } from 'zod'
import { queryClient } from '@/app/data'
import { simulationApi, simulationKeys } from '@/services/simulation'
import { assertRunIdentity, assertFrameIdentity } from '@/services/simulation/identity'
import { configurationSchema, terminalRun } from '@/types/simulation'
import type { SimulationModel, SimulationSession } from '@/types/simulation'
import { readStored, resetStored } from '@/lib/storage'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ConfirmAction, ErrorState, Loading } from '@/components/shared'
import ScientificViewport from './viewport/ScientificViewport'
import type { ViewMode } from './viewport/ScientificViewport'
import Timeline from './components/Timeline'
import TracePlot from './components/TracePlot'
import { componentById } from './viewport/apparatus'
import ConfigurationPanel from './components/ConfigurationPanel'
import ResearchInspector from './components/ResearchInspector'
function captureTime() {
  return new Date().toISOString()
}
const draftSchema = z.object({
  title: z.string(),
  notes: z.string(),
  configuration: configurationSchema,
})
export default function Studio() {
  const { simulationSessionId = '' } = useParams()
  const session = useQuery({
    queryKey: simulationKeys.session(simulationSessionId),
    queryFn: ({ signal }) => simulationApi.getSession(simulationSessionId, signal),
  })
  const model = useQuery({
    queryKey: [
      simulationApi.mode,
      'simulation-model',
      session.data?.modelId,
      session.data?.modelVersion,
    ],
    queryFn: ({ signal }) =>
      simulationApi.getModel(session.data!.modelId, session.data!.modelVersion, signal),
    enabled: !!session.data,
  })
  if (session.isError || model.isError)
    return (
      <div className="page">
        <ErrorState
          error={session.error ?? model.error}
          retry={() => {
            void session.refetch()
            void model.refetch()
          }}
        />
      </div>
    )
  if (!session.data || !model.data)
    return (
      <div className="page">
        <Loading label="Opening Simulation Studio…" />
      </div>
    )
  return <StudioWorkspace key={session.data.id} initial={session.data} model={model.data} />
}
function StudioWorkspace({
  initial,
  model,
}: {
  initial: SimulationSession
  model: SimulationModel
}) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [session, setSession] = useState(initial)
  const draftKey = `firesight:simulation-draft:v1:${session.id}:${session.version}`
  const [loaded] = useState(() => {
    try {
      return {
        draft: readStored(draftKey, draftSchema, {
          title: initial.title,
          notes: initial.notes,
          configuration: initial.revisions.at(-1)!.configuration,
        }),
        error: '',
      }
    } catch (e) {
      return {
        draft: {
          title: initial.title,
          notes: initial.notes,
          configuration: initial.revisions.at(-1)!.configuration,
        },
        error: e instanceof Error ? e.message : 'Draft unavailable',
      }
    }
  })
  const [draft, setDraft] = useState(loaded.draft)
  const [error, setError] = useState(loaded.error)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [workspaceMode, setWorkspaceMode] = useState(readWorkspaceMode)
  const modeStorageError = useDraftPersistence('firesight:workspace-mode:v1', workspaceMode)
  const [configOpen, setConfigOpen] = useState(
    () =>
      workspacePresets[workspaceMode].configuration && matchMedia('(min-width: 1100px)').matches,
  )
  const { prefs, update: updatePreferences } = usePreferences()
  const configurationTrigger = useRef<HTMLButtonElement>(null)
  const researchTrigger = useRef<HTMLButtonElement>(null)
  const [inspector, setInspector] = useState(
    () => workspacePresets[workspaceMode].inspector && matchMedia('(min-width: 1100px)').matches,
  )
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('selection')
  const [focusRequest, setFocusRequest] = useState(0)
  const [analysisOpen, setAnalysisOpen] = useState(workspacePresets[workspaceMode].analysis)
  const [analysisTab, setAnalysisTab] = useState<'trace' | 'comparison' | 'runs'>('trace')
  const [dock] = useState(() => {
    try {
      return readStored(
        'firesight:docks:v1',
        z.object({
          left: z.number().min(200).max(340),
          right: z.number().min(260).max(400),
          bottom: z.number().min(160).max(400),
        }),
        { left: 232, right: 292, bottom: 240 },
      )
    } catch {
      return { left: 232, right: 292, bottom: 240 }
    }
  })
  const [dockSizes, setDockSizes] = useState(dock)
  const [analyzeHeight, setAnalyzeHeight] = useState(300)
  const dockStorageError = useDraftPersistence('firesight:docks:v1', dockSizes, true)
  const [sceneSettings, setSceneSettings] = useState(() => {
    try {
      return readStored(
        `firesight:scene:v1:${initial.id}`,
        sceneSettingsSchema,
        defaultSceneSettings,
      )
    } catch {
      return defaultSceneSettings
    }
  })
  const sceneStorageError = useDraftPersistence(
    `firesight:scene:v1:${initial.id}`,
    sceneSettings,
    true,
  )
  const [wide, setWide] = useState(() => matchMedia('(min-width: 1100px)').matches)
  useEffect(() => {
    const media = matchMedia('(min-width: 1100px)')
    const update = () => {
      setWide(media.matches)
      if (!media.matches) {
        setInspector(false)
        setConfigOpen(false)
      }
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const runOperation = useRef<{ revisionId: string; id: string } | null>(null)
  const [outcome, setOutcome] = useState<'complete' | 'fail'>('complete')
  const current = session.revisions.at(-1)!
  const dirty = JSON.stringify(draft.configuration) !== JSON.stringify(current.configuration)
  const unsaved = dirty || draft.title !== session.title || draft.notes !== session.notes
  const storageError = useDraftPersistence(draftKey, draft, !loaded.error)
  const runs = useQuery({
    queryKey: simulationKeys.runs(session.id),
    queryFn: async ({ signal }) => {
      const data = await simulationApi.listRuns(session.id, signal)
      data.forEach((run) => assertRunIdentity(run, session))
      return data
    },
    refetchInterval: (q) =>
      q.state.data?.some((r) => !terminalRun(r.status))
        ? simulationApi.mode === 'demo'
          ? 350
          : 2000
        : false,
  })
  const selectedRunId = params.get('run')
  const run =
    runs.data?.find((r) => r.id === selectedRunId) ??
    (!selectedRunId ? runs.data?.at(-1) : undefined)
  const runRevision = session.revisions.find((r) => r.id === run?.revisionId)
  const frames = useQuery({
    queryKey: [simulationApi.mode, 'simulation-frames', run?.id],
    queryFn: async ({ signal }) => {
      const data = await simulationApi.getFrames(run!.id, signal)
      assertFrameIdentity(data, run!)
      return data
    },
    enabled: run?.status === 'completed',
  })
  const requestedFrame = params.get('frame')
  const foundIndex = frames.data?.findIndex((f) => f.id === requestedFrame) ?? -1
  const index = Math.max(0, foundIndex)
  const frame = frames.data?.[index]
  const view: ViewMode =
    params.get('view') === 'slice' ? 'slice' : params.get('view') === 'table' ? 'table' : 'points'
  const selectedId = params.get('entity') ?? 'sample'
  const selectedSampleId = componentById(selectedId) ? 'p-111' : selectedId
  const compareRun = runs.data?.find((r) => r.id === params.get('compareRun'))
  const compareRevision = session.revisions.find((r) => r.id === compareRun?.revisionId)
  const comparison = useQuery({
    queryKey: [simulationApi.mode, 'simulation-frames', compareRun?.id],
    queryFn: async ({ signal }) => {
      const data = await simulationApi.getFrames(compareRun!.id, signal)
      assertFrameIdentity(data, compareRun!)
      return data
    },
    enabled: compareRun?.status === 'completed',
  })
  const pinnedFrame = comparison.data?.find(
    (f) =>
      f.coordinate.value === frame?.coordinate.value && f.coordinate.unit === frame.coordinate.unit,
  )
  const updateParams = useCallback(
    (values: Record<string, string | null>) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(values)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const setView = useCallback((value: ViewMode) => updateParams({ view: value }), [updateParams])
  const setIndex = useCallback(
    (i: number) => {
      const f = frames.data?.[i]
      if (f) updateParams({ frame: f.id })
    },
    [frames.data, updateParams],
  )
  useEffect(() => {
    if (!unsaved) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])
  async function perform(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed. Your configuration is retained.')
    } finally {
      setBusy(false)
    }
  }
  async function save() {
    if (!draft.title.trim()) {
      document.getElementById('studio-title')?.focus()
      throw new Error('Enter an experiment title.')
    }
    const saved = await simulationApi.saveSession(session.id, {
      version: session.version,
      ...draft,
    })
    setSession(saved)
    resetStored(draftKey)
    setNotice(
      `Saved ${dirty ? 'new configuration revision' : 'experiment'} on ${simulationApi.mode === 'demo' ? 'this device' : 'the API'}.`,
    )
    queryClient.setQueryData(simulationKeys.session(saved.id), saved)
    await queryClient.invalidateQueries({ queryKey: simulationKeys.sessions })
  }
  async function runSequence() {
    if (dirty)
      throw new Error(
        'Save the new configuration before running it. Existing results still belong to their original revision.',
      )
    if (runOperation.current?.revisionId !== current.id) runOperation.current = null
    const created = await simulationApi.submitRun(
      session.id,
      current.id,
      (runOperation.current ??= { revisionId: current.id, id: crypto.randomUUID() }).id,
      outcome,
    )
    runOperation.current = null
    setPlaying(false)
    updateParams({ run: created.id, frame: null, compareRun: null })
    await runs.refetch()
  }
  async function fork() {
    if (unsaved)
      throw new Error(
        'Save your experiment before forking so the fork has an exact source revision.',
      )
    const saved = await simulationApi.createSession({
      title: `${session.title.slice(0, 112)} · fork`,
      modelId: model.id,
      modelVersion: model.version,
      configuration: current.configuration,
      studyIds: session.studyIds,
      parent: { sessionId: session.id, revisionId: current.id },
    })
    await queryClient.invalidateQueries({ queryKey: simulationKeys.sessions })
    navigate(`/lab/studio/${saved.id}`)
  }
  async function handleAsk() {
    const context = await simulationApi.captureContext({
      schemaVersion: 'simulation.v1',
      id: crypto.randomUUID(),
      capturedAt: captureTime(),
      sessionId: session.id,
      sessionTitle: session.title,
      modelId: run?.modelId ?? model.id,
      modelVersion: run?.modelVersion ?? model.version,
      revisionId: run?.revisionId ?? current.id,
      configurationDigest: run?.configurationDigest ?? current.configurationDigest,
      runId: run?.id ?? null,
      frameId: frame?.id ?? null,
      timestamp: frame?.coordinate ?? null,
      visualization: view,
      comparison: compareRun
        ? {
            runId: compareRun.id,
            revisionId: compareRun.revisionId,
            frameId: pinnedFrame?.id ?? null,
          }
        : null,
      selectedComponentId: componentById(selectedId)?.id ?? null,
      selectedMeasurement: frame?.measurements.find((m) => m.entityId === selectedId) ?? null,
      origin: run?.origin ?? model.origin,
      studyIds: session.studyIds,
      evidenceIds: (run?.provenance ?? model.provenance).map((p) => p.id),
      limitations: model.limitations,
    })
    navigate(
      `/?simulation=${encodeURIComponent(context.id)}&question=${encodeURIComponent('Explain the selected illustrative sample and its limitations.')}`,
    )
  }

  const selectEntity = (entity: string) => {
    setPlaying(false)
    updateParams({ entity })
    setInspector(true)
    setInspectorTab('selection')
  }
  const openCopilot = () => {
    setInspector(true)
    setInspectorTab('copilot')
  }
  const configurationPanel = (
    <>
      {' '}
      <ConfigurationPanel
        session={session}
        model={model}
        title={draft.title}
        onTitle={(title) => setDraft((d) => ({ ...d, title }))}
        notes={draft.notes}
        onNotes={(notes) => setDraft((d) => ({ ...d, notes }))}
        configuration={draft.configuration}
        onConfiguration={(configuration) => setDraft((d) => ({ ...d, configuration }))}
        dirty={dirty}
        busy={busy}
        onSave={() => void perform(save)}
        outcome={outcome}
        onOutcome={setOutcome}
        sceneSettings={sceneSettings}
        onSceneSettings={setSceneSettings}
      />
      {loaded.error ? (
        <ConfirmAction
          title="Reset unreadable Studio draft?"
          description="Only this unreadable draft is removed. Saved experiments, runs and other records remain available."
          actionLabel="Reset Studio draft"
          trigger={<Button variant="outline">Reset unreadable Studio draft…</Button>}
          onConfirm={() => {
            resetStored(draftKey)
            window.location.reload()
          }}
        />
      ) : null}
    </>
  )
  const researchPanel = (
    <ResearchInspector
      sessionId={session.id}
      sessionTitle={session.title}
      model={model}
      run={run}
      revision={runRevision}
      frame={frame}
      selectedId={selectedId}
      studyIds={session.studyIds}
      busy={busy}
      onAsk={() => void perform(handleAsk)}
      onProposeView={() => setView('table')}
      tab={inspectorTab}
      onTab={setInspectorTab}
      onFocus={() => {
        setView('points')
        setFocusRequest((n) => n + 1)
      }}
      compareRunId={compareRun?.id}
      visualization={view}
    />
  )
  const stageError =
    runs.error ??
    frames.error ??
    (selectedRunId && runs.isSuccess && !run
      ? new Error('This run does not belong to the experiment. Choose an available run.')
      : requestedFrame && frames.isSuccess && foundIndex < 0
        ? new Error('The selected frame is unavailable. Choose another frame.')
        : null)
  const inlineError =
    modeStorageError || error || storageError || dockStorageError || sceneStorageError
  function changeWorkspace(next: WorkspaceMode) {
    setWorkspaceMode(next)
    setConfigOpen(wide && workspacePresets[next].configuration)
    setInspector(wide && workspacePresets[next].inspector)
    setAnalysisOpen(workspacePresets[next].analysis)
  }
  const workspaceStyle = {
    '--config-size': `${dockSizes.left}px`,
    '--inspector-size': `${dockSizes.right}px`,
    '--analysis-size': `${analysisOpen ? (workspaceMode === 'analyze' ? analyzeHeight : dockSizes.bottom) : 112}px`,
  } as CSSProperties
  return (
    <div className={`page studio-page workstation mode-${workspaceMode}`} style={workspaceStyle}>
      <header className="workstation-toolbar">
        <Link to="/lab" className="workstation-back" aria-label="Research Lab">
          <ArrowLeft aria-hidden="true" />
        </Link>
        <div className="workstation-title">
          <span className="eyebrow">LAB / SOLID FUEL</span>
          <h1 tabIndex={-1}>{session.title}</h1>
        </div>
        <div className="workstation-tools">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle primary navigation"
            onClick={() => updatePreferences({ collapsed: !prefs.collapsed })}
          >
            <PanelLeftClose />
          </Button>
          <Button
            variant="ghost"
            ref={configurationTrigger}
            aria-label={configOpen ? 'Hide configuration' : 'Configuration'}
            title="Experiment configuration"
            aria-expanded={configOpen}
            onClick={() => setConfigOpen((v) => !v)}
          >
            <Settings2 aria-hidden="true" />
            <span>{configOpen ? 'Hide configuration' : 'Configuration'}</span>
          </Button>
          <Button
            variant="ghost"
            ref={researchTrigger}
            aria-label="Research & Copilot"
            title="Research & Copilot"
            aria-expanded={inspector}
            onClick={() => {
              setInspector(true)
              setInspectorTab('copilot')
            }}
          >
            <Fingerprint aria-hidden="true" />
            <span>Research & Copilot</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fork experiment"
            title="Fork experiment"
            disabled={busy}
            onClick={() => void perform(fork)}
          >
            <Copy />
          </Button>
          <div className="run-command">
            <span className="run-status" data-status={run?.status}>
              {run?.status ?? 'Preview'}
            </span>
            {run && !terminalRun(run.status) ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    await simulationApi.cancelRun(run.id)
                    await runs.refetch()
                  })
                }
              >
                <Square aria-hidden="true" />
                Cancel fixture load
              </Button>
            ) : (
              <Button
                disabled={busy || dirty || !model.capabilities.canRun}
                onClick={() => void perform(runSequence)}
              >
                <Play aria-hidden="true" />
                {simulationApi.mode === 'demo' ? 'Run demonstration' : 'Run simulation'}
              </Button>
            )}
          </div>
        </div>
      </header>
      <div className="workstation-meta run-identity-strip">
        <div className="workspace-presets" role="group" aria-label="Workspace preset">
          {(['explore', 'workstation', 'analyze'] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={workspaceMode === mode}
              onClick={() => changeWorkspace(mode)}
            >
              {mode === 'explore' ? 'Explore' : mode === 'analyze' ? 'Analyze' : 'Workstation'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="validity-indicator"
          onClick={() => {
            setInspector(true)
            setInspectorTab('evidence')
          }}
        >
          <span />
          Illustrative · model unvalidated
        </button>
        <span>
          Configuration <b>r{runRevision?.number ?? current.number}</b>
        </span>
        <span>
          Run <b className="mono">{run?.id.slice(0, 8) ?? 'not loaded'}</b>
        </span>
        <span>
          Frame <b>{frame ? `step ${frame.coordinate.value}` : 'preview'}</b>
        </span>
        <span className="configuration-state" role="status">
          {unsaved ? 'Unsaved draft · retained locally' : 'Saved configuration'}
          {run && (run.revisionId !== current.id || dirty)
            ? ' · Results belong to an earlier configuration'
            : ''}
        </span>
      </div>
      <div
        className={`workstation-grid ${configOpen ? 'configuration-visible' : ''} ${inspector ? 'inspector-visible' : ''}`}
      >
        {configOpen && wide ? (
          <>
            <div className="configuration-dock" id="configuration-region">
              <div className="dock-panel-title">
                <span>Experiment setup</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close configuration"
                  onClick={() => setConfigOpen(false)}
                >
                  <X />
                </Button>
              </div>
              {configurationPanel}
              {session.parent ? (
                <Link className="text-link" to={`/lab/studio/${session.parent.sessionId}`}>
                  parent experiment
                </Link>
              ) : null}
            </div>
            <DockSplitter
              label="Resize configuration panel"
              value={dockSizes.left}
              min={200}
              max={340}
              onChange={(left) => setDockSizes((d) => ({ ...d, left }))}
            />
          </>
        ) : null}
        <div className="workstation-center" aria-label="Scientific viewport and analysis">
          <div className="workstation-scene">
            <ScientificViewport
              split={workspaceMode === 'analyze'}
              frame={frame}
              view={view}
              onView={setView}
              selectedId={selectedId}
              onSelect={selectEntity}
              settings={sceneSettings}
              onSettings={setSceneSettings}
              onInspect={() => {
                setInspector(true)
                setInspectorTab('selection')
              }}
              onAsk={openCopilot}
              focusRequest={focusRequest}
            />
            {stageError ? (
              <div className="scene-state-overlay">
                <ErrorState
                  error={stageError}
                  retry={() => {
                    void runs.refetch()
                    void frames.refetch()
                  }}
                />
              </div>
            ) : run?.status === 'failed' ? (
              <div className="scene-state-overlay">
                <h2>Fixture load failed</h2>
                <p>{run.error}</p>
                <Button onClick={() => setConfigOpen(true)}>Open demonstration controls</Button>
              </div>
            ) : run?.status === 'cancelled' ? (
              <div className="scene-state-overlay">
                <h2>Load cancelled</h2>
                <p>Your saved configuration and earlier runs are retained.</p>
                <Button onClick={() => void perform(runSequence)}>Run again</Button>
              </div>
            ) : run && !terminalRun(run.status) ? (
              <div className="scene-loading-note" role="status">
                <FlaskConical aria-hidden="true" />
                {run.status === 'queued'
                  ? 'Demonstration queued'
                  : 'Loading authored observations…'}
              </div>
            ) : !frame ? (
              <div className="scene-preview-note">
                Preview · load a demonstration to explore frames
              </div>
            ) : null}
          </div>
          <DockSplitter
            label="Resize analysis dock"
            axis="horizontal"
            value={workspaceMode === 'analyze' ? analyzeHeight : dockSizes.bottom}
            min={160}
            max={400}
            reverse
            onChange={(bottom) => {
              setAnalysisOpen(true)
              if (workspaceMode === 'analyze') setAnalyzeHeight(bottom)
              else setDockSizes((d) => ({ ...d, bottom }))
            }}
          />
          <section
            className={`analysis-dock ${analysisOpen ? 'expanded' : 'collapsed'}`}
            aria-label="Timeline and analysis dock"
          >
            <div className="analysis-dock-heading">
              <div className="analysis-tabs">
                {(['trace', 'comparison', 'runs'] as const).map((tab) => (
                  <Button
                    key={tab}
                    size="sm"
                    variant="ghost"
                    aria-pressed={analysisTab === tab && analysisOpen}
                    onClick={() => {
                      setAnalysisTab(tab)
                      setAnalysisOpen(true)
                    }}
                  >
                    {tab === 'trace'
                      ? 'Measurements'
                      : tab === 'comparison'
                        ? 'Comparison'
                        : 'Runs'}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={analysisOpen ? 'Collapse analysis' : 'Expand analysis'}
                aria-expanded={analysisOpen}
                onClick={() => setAnalysisOpen((v) => !v)}
              >
                {analysisOpen ? <ChevronDown /> : <ChevronUp />}
              </Button>
            </div>
            {frame && frames.data?.length ? (
              <Timeline
                frames={frames.data}
                index={index}
                onIndex={setIndex}
                playing={playing}
                onPlaying={setPlaying}
                speed={speed}
                onSpeed={setSpeed}
              />
            ) : (
              <div className="timeline-empty">
                No output loaded · configuration and scene preview are ready.
              </div>
            )}
            {analysisOpen ? (
              <div className="analysis-dock-content">
                <div hidden={analysisTab !== 'trace'}>
                  {frame && frames.data?.length ? (
                    <TracePlot
                      frames={frames.data}
                      index={index}
                      entityId={selectedSampleId}
                      onIndex={(i) => {
                        setPlaying(false)
                        updateParams({ entity: selectedSampleId, frame: frames.data[i].id })
                      }}
                    />
                  ) : (
                    <p className="dock-empty-message">
                      Load authored observations to inspect exact scalar values.
                    </p>
                  )}
                </div>
                <div hidden={analysisTab !== 'comparison'}>
                  <div className="comparison-selector">
                    <label>
                      Pin comparison
                      <NativeSelect
                        aria-label="Pin comparison"
                        value={compareRun?.id ?? ''}
                        onChange={(e) => updateParams({ compareRun: e.target.value || null })}
                      >
                        <NativeSelectOption value="">Choose a completed run</NativeSelectOption>
                        {runs.data
                          ?.filter((r) => r.id !== run?.id && r.status === 'completed')
                          .map((r) => (
                            <NativeSelectOption key={r.id} value={r.id}>
                              {r.id.slice(0, 8)} · r
                              {session.revisions.find((v) => v.id === r.revisionId)?.number}
                            </NativeSelectOption>
                          ))}
                      </NativeSelect>
                    </label>
                    <span>Authored observations · matched fixture steps only</span>
                  </div>
                  {compareRun ? (
                    <div className="comparison-traces">
                      <div>
                        <h3>
                          Active · r{runRevision?.number} · {runRevision?.configuration.sequenceId}
                        </h3>
                        {frames.data && frame ? (
                          <TracePlot
                            frames={frames.data}
                            index={index}
                            entityId={selectedSampleId}
                            onIndex={(i) => {
                              setPlaying(false)
                              setIndex(i)
                            }}
                          />
                        ) : null}
                      </div>
                      <div>
                        <h3>
                          Pinned run · r{compareRevision?.number} ·{' '}
                          {compareRevision?.configuration.sequenceId}
                        </h3>
                        {comparison.isError ? (
                          <ErrorState error={comparison.error} />
                        ) : pinnedFrame && comparison.data ? (
                          <TracePlot
                            frames={comparison.data}
                            index={comparison.data.findIndex((f) => f.id === pinnedFrame.id)}
                            entityId={selectedSampleId}
                            onIndex={(i) => {
                              const coordinate = comparison.data?.[i].coordinate
                              const target =
                                frames.data?.findIndex(
                                  (f) =>
                                    f.coordinate.value === coordinate?.value &&
                                    f.coordinate.unit === coordinate.unit,
                                ) ?? -1
                              if (target >= 0) {
                                setPlaying(false)
                                setIndex(target)
                              }
                            }}
                          />
                        ) : (
                          <p>No matching step in the comparison.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="dock-empty-message">
                      Load a second saved demonstration to compare. These are synthetic
                      observations, not recorded NASA data.
                    </p>
                  )}
                </div>
                <section className="studio-run-history" hidden={analysisTab !== 'runs'}>
                  <div className="run-history-controls">
                    <label>
                      Inspect run
                      <NativeSelect
                        aria-label="Inspect run"
                        value={run?.id ?? ''}
                        onChange={(e) => {
                          setPlaying(false)
                          updateParams({ run: e.target.value, frame: null, compareRun: null })
                        }}
                      >
                        <NativeSelectOption value="" disabled>
                          Select run
                        </NativeSelectOption>
                        {runs.data?.map((r) => (
                          <NativeSelectOption key={r.id} value={r.id}>
                            {r.id.slice(0, 8)} · r
                            {session.revisions.find((v) => v.id === r.revisionId)?.number} ·{' '}
                            {r.status}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </label>
                  </div>
                  {!runs.data?.length ? (
                    <p>Your first run will appear here.</p>
                  ) : (
                    <p>Each run retains its original configuration, source and identity.</p>
                  )}
                  <details>
                    <summary>Run provenance & warnings</summary>
                    {run?.warnings.map((w) => (
                      <p key={w.code}>{w.message}</p>
                    ))}
                    <p>
                      {model.title} · v{model.version} · {run?.origin ?? model.origin}
                    </p>
                  </details>
                </section>
              </div>
            ) : null}
          </section>
        </div>
        {inspector && wide ? (
          <>
            <DockSplitter
              label="Resize research panel"
              value={dockSizes.right}
              min={260}
              max={400}
              reverse
              onChange={(right) => setDockSizes((d) => ({ ...d, right }))}
            />
            <aside className="docked-copilot">
              <div className="dock-panel-title">
                <span>Research intelligence</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close research panel"
                  onClick={() => setInspector(false)}
                >
                  <X />
                </Button>
              </div>
              {researchPanel}
            </aside>
          </>
        ) : null}
      </div>
      <div className="workstation-status" role="status">
        <span>
          {inlineError ||
            notice ||
            `${model.title} v${model.version} · local frontend demonstration`}
        </span>
        <span>
          Step {frame?.coordinate.value ?? '—'} · {frames.data?.length ?? 0} frames
        </span>
      </div>
      <Sheet open={inspector && !wide} onOpenChange={setInspector}>
        <SheetContent
          className="studio-research-sheet"
          side="right"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            researchTrigger.current?.focus()
          }}
        >
          <SheetHeader>
            <SheetTitle>Research intelligence</SheetTitle>
            <SheetDescription>Context, conversation and scientific evidence.</SheetDescription>
          </SheetHeader>
          {researchPanel}
        </SheetContent>
      </Sheet>
      <Sheet open={configOpen && !wide} onOpenChange={setConfigOpen}>
        <SheetContent
          className="studio-config-sheet"
          side="left"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            configurationTrigger.current?.focus()
          }}
        >
          <SheetHeader>
            <SheetTitle>Experiment configuration</SheetTitle>
            <SheetDescription>
              Visualization settings, demonstration configurations and model capabilities.
            </SheetDescription>
          </SheetHeader>
          {configurationPanel}
        </SheetContent>
      </Sheet>
    </div>
  )
}

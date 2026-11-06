import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, FlaskConical, MessageSquare, Plus, Save } from 'lucide-react'
import { api, keys, queryClient, refreshSessions } from '@/app/data'
import { newSession } from '@/lib/session'
import { emptyContext, sessionSchema } from '@/types/research'
import type { LabSession, LabViewSnapshot } from '@/types/research'
import { readStored, resetStored } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmAction, ErrorState, Loading, PageHeading } from '@/components/shared'

import LabControls from './LabControls'
import LabStage from './LabStage'
function LabWorkspace({ initial }: { initial: LabSession }) {
  const navigate = useNavigate()
  const draftKey = initial.revision
    ? `firesight:lab-draft:v1:${initial.id}`
    : 'firesight:lab:new:v1'
  const [loaded] = useState(() => {
    try {
      const draft = readStored(draftKey, sessionSchema, initial)
      return { value: draft.revision === initial.revision ? draft : initial, error: '' }
    } catch (e) {
      return {
        value: initial,
        error: e instanceof Error ? e.message : 'Working draft unavailable.',
      }
    }
  })
  const [session, setSession] = useState(loaded.value)
  const [baseline, setBaseline] = useState(JSON.stringify(initial))
  const [error, setError] = useState(loaded.error)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(session) !== baseline
  const datasetId = session.context.datasetIds[0] ?? ''
  const dataset = useQuery({
    queryKey: keys.dataset(datasetId),
    queryFn: () => api.getDataset(datasetId),
    enabled: !!datasetId,
  })
  const rows = useQuery({
    queryKey: [api.mode, 'rows', datasetId, dataset.data?.revision],
    queryFn: () => api.getRows(datasetId, dataset.data!.revision),
    enabled: !!dataset.data,
  })
  const sessions = useQuery({ queryKey: keys.sessions, queryFn: () => api.listSessions() })
  const storageError = useDraftPersistence(draftKey, session, !loaded.error)
  async function save(ask = false) {
    if (!session.title.trim()) {
      setError('Enter a workspace title.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const snapshot: LabViewSnapshot = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        studyIds: session.context.studyIds,
        datasets: dataset.data
          ? [{ id: dataset.data.id, revision: dataset.data.revision, origin: dataset.data.origin }]
          : [],
        view: session.visualization,
        rowFilters: [],
        selectedRowIds: session.selectedRowIds,
        unitLabels: Object.fromEntries((dataset.data?.variables ?? []).map((v) => [v.id, v.unit])),
        limitations: dataset.data?.limitations ?? ['No numerical measurements are attached.'],
      }
      const saved = await api.saveSession({
        ...session,
        snapshots: ask ? [...session.snapshots, snapshot] : session.snapshots,
      })
      setSession(saved)
      setBaseline(JSON.stringify(saved))
      resetStored(draftKey)
      queryClient.setQueryData(keys.session(saved.id), saved)
      await refreshSessions()
      navigate(ask ? `/?lab=${saved.id}&view=${snapshot.id}` : `/lab/${saved.id}`, {
        replace: !ask,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed. Your working view is preserved.')
    } finally {
      setBusy(false)
    }
  }
  function patchView(patch: Partial<LabSession['visualization']>) {
    setSession((s) => ({ ...s, visualization: { ...s.visualization, ...patch } }))
  }
  return (
    <>
      <PageHeading
        label="Scientific exploration"
        title="The research Lab"
        description="Keep the source, explore the data, document what you see."
        action={
          <Button disabled={busy} onClick={() => save()}>
            <Save data-icon="inline-start" />
            {busy ? 'Saving…' : 'Save workspace'}
          </Button>
        }
      />
      <div className="lab-toolbar">
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor="session-title">
              Workspace title
            </FieldLabel>
            <Input
              id="session-title"
              name="workspaceTitle"
              value={session.title}
              maxLength={120}
              onChange={(e) => setSession((s) => ({ ...s, title: e.target.value }))}
            />
          </Field>
        </FieldGroup>
        <span className="save-status" role="status">
          {dirty ? (
            'Unsaved workspace · draft retained locally'
          ) : initial.revision ? (
            <>
              <Check aria-hidden="true" />
              Saved {api.mode === 'demo' ? 'on this device' : 'to API'}
            </>
          ) : (
            'New local workspace'
          )}
        </span>
        <Button variant="ghost" onClick={() => navigate('/lab?new=' + crypto.randomUUID())}>
          <Plus data-icon="inline-start" />
          New workspace
        </Button>
      </div>
      {error ? <ErrorState error={new Error(error)} retry={() => save()} /> : null}
      {loaded.error ? (
        <ConfirmAction
          title="Discard unreadable working draft?"
          description="Only the unreadable Lab draft is reset. The last saved session and other research remain available."
          actionLabel="Reset working draft"
          trigger={<Button variant="outline">Reset unreadable working draft…</Button>}
          onConfirm={() => {
            resetStored(draftKey)
            window.location.reload()
          }}
        />
      ) : null}
      {storageError ? (
        <p role="status" className="error-text">
          {storageError}
        </p>
      ) : null}
      <div className="lab-layout">
        <LabControls
          session={session}
          setSession={setSession}
          dataset={dataset.data}
          patchView={patchView}
        />
        <LabStage
          session={session}
          setSession={setSession}
          dataset={dataset}
          rows={rows}
          patchView={patchView}
        />
      </div>
      <section className="lab-notes">
        <div className="section-heading">
          <h2>Research notes</h2>
          <Badge variant="outline">User-authored</Badge>
        </div>
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor="lab-notes">
              Research notes
            </FieldLabel>
            <Textarea
              id="lab-notes"
              name="researchNotes"
              value={session.notes}
              maxLength={20000}
              onChange={(e) => setSession((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Record a question, observation or next step. Your notes are separate from source findings…"
            />
          </Field>
        </FieldGroup>
        <div className="notes-footer">
          <p>Notes stay with this workspace. They are not scientific findings.</p>
          <Button variant="outline" disabled={busy} onClick={() => save(true)}>
            <MessageSquare data-icon="inline-start" />
            Ask about this view
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>
      {sessions.data?.length ? (
        <section className="saved-sessions">
          <div className="section-heading">
            <h2>Saved workspaces</h2>
            <Save aria-hidden="true" />
          </div>
          {sessions.data.map((s) => (
            <Link key={s.id} to={`/lab/${s.id}`}>
              <FlaskConical aria-hidden="true" />
              <span>{s.title}</span>
              <small>
                {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
                  new Date(s.updatedAt),
                )}
              </small>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </section>
      ) : null}
    </>
  )
}
export default function Lab() {
  const { sessionId } = useParams()
  const query = useQuery({
    queryKey: keys.session(sessionId ?? ''),
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  })
  const [search] = useSearchParams()
  if (sessionId && query.isPending)
    return (
      <div className="page">
        <Loading label="Opening Lab workspace…" />
      </div>
    )
  if (query.isError)
    return (
      <div className="page">
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </div>
    )
  return (
    <div className="page lab-page">
      {query.data ? (
        <LabWorkspace key={sessionId} initial={query.data} />
      ) : (
        <BlankLab key={search.get('new') ?? 'new'} forceNew={search.has('new')} />
      )}
    </div>
  )
}

function BlankLab({ forceNew }: { forceNew: boolean }) {
  const [blank] = useState(() => {
    const fresh = newSession(emptyContext())
    if (forceNew) return fresh
    try {
      return readStored('firesight:lab:new:v1', sessionSchema, fresh)
    } catch {
      return fresh
    }
  })
  return <LabWorkspace initial={blank} />
}

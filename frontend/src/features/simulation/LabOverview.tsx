import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Box, FlaskConical, Plus, BookOpen } from 'lucide-react'
import { api, keys } from '@/app/data'
import { simulationApi, simulationKeys } from '@/services/simulation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, Loading, PageHeading } from '@/components/shared'
import Lab from '@/features/lab/Lab'
export default function LabOverview() {
  const [params] = useSearchParams()
  return params.has('new') || params.has('notebook') ? <Lab /> : <Overview />
}
function Overview() {
  const sessions = useQuery({
    queryKey: simulationKeys.sessions,
    queryFn: ({ signal }) => simulationApi.listSessions(signal),
  })
  const models = useQuery({
    queryKey: simulationKeys.models,
    queryFn: ({ signal }) => simulationApi.listModels(signal),
  })
  const notebooks = useQuery({ queryKey: keys.sessions, queryFn: () => api.listSessions() })
  return (
    <div className="page simulation-overview">
      <PageHeading
        label="Scientific exploration"
        title="The research Lab"
        description="An experiment is more than its result. Keep the configuration, the source and the limits together."
        action={
          <Button asChild>
            <Link to="/lab/new">
              <Plus data-icon="inline-start" />
              New Experiment
            </Link>
          </Button>
        }
      />
      <div className="studio-overview-intro">
        <div>
          <p className="eyebrow">Simulation Studio</p>
          <h2>
            Configure. Inspect.
            <br />
            <em>Keep the evidence.</em>
          </h2>
          <p>
            Explore identified model outputs through a shared viewport, timeline and research
            notebook.
          </p>
          <Button variant="outline" asChild>
            <Link to="/lab/new">
              Create an experiment
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <div className="capability-register">
          <h3>Scientific capability</h3>
          <dl>
            <div>
              <dt>Recorded NASA frames</dt>
              <dd>Not connected</dd>
            </div>
            <div>
              <dt>Validated computational models</dt>
              <dd>Not connected</dd>
            </div>
            <div>
              <dt>Illustrative frontend workflows</dt>
              <dd>{api.mode === 'demo' ? 'Available locally' : 'Demo disabled in HTTP mode'}</dd>
            </div>
          </dl>
          <p>Rendering a field does not establish its physical accuracy.</p>
        </div>
      </div>
      <section className="simulation-section">
        <div className="section-heading">
          <h2>Saved experiments</h2>
          <Box aria-hidden="true" />
        </div>
        {sessions.isPending ? (
          <Loading label="Loading experiments…" />
        ) : sessions.isError ? (
          <ErrorState error={sessions.error} retry={() => sessions.refetch()} />
        ) : !sessions.data.length ? (
          <EmptyState
            title="A workspace for your next question"
            description="Start with an available model. Every saved experiment retains its model version and configuration history."
          >
            <Button asChild variant="outline">
              <Link to="/lab/new">New Experiment</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="experiment-list">
            {sessions.data.map((s) => (
              <Link key={s.id} to={`/lab/studio/${s.id}`}>
                <Box aria-hidden="true" />
                <div>
                  <h3>{s.title}</h3>
                  <p>
                    {s.modelId} · v{s.modelVersion} · {s.revisions.length} configuration revision
                    {s.revisions.length === 1 ? '' : 's'}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="simulation-section">
        <div className="section-heading">
          <h2>Model catalog</h2>
          <span className="muted">Versioned capabilities</span>
        </div>
        {models.isPending ? (
          <Loading label="Loading model catalog…" />
        ) : models.isError ? (
          <ErrorState error={models.error} retry={() => models.refetch()} />
        ) : models.data.length ? (
          models.data.map((m) => (
            <div className="model-record" key={`${m.id}@${m.version}`}>
              <FlaskConical aria-hidden="true" />
              <div>
                <h3>
                  {m.title} <span className="mono muted">v{m.version}</span>
                </h3>
                <p>{m.description}</p>
                <Badge variant="outline">
                  {m.origin === 'illustrative'
                    ? 'Illustrative / Not Scientifically Validated'
                    : 'Inspect model provenance'}
                </Badge>
              </div>
              <Button asChild variant="outline">
                <Link to={`/lab/new?model=${encodeURIComponent(m.id)}`}>
                  Configure
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          ))
        ) : (
          <p className="missing-field">
            No supported models are connected. You can still explore the research library and data
            notebooks.
          </p>
        )}
      </section>
      <section className="simulation-section">
        <div className="section-heading">
          <h2>Data notebooks</h2>
          <Button asChild variant="ghost">
            <Link to="/lab?notebook=1">
              <BookOpen data-icon="inline-start" />
              Open a blank notebook
            </Link>
          </Button>
        </div>
        <p className="muted">
          Inspect tabular data independently from simulation runs. Existing workspaces are
          preserved.
        </p>
        {notebooks.isError ? (
          <ErrorState error={notebooks.error} />
        ) : (
          notebooks.data?.map((s) => (
            <Link className="notebook-link" key={s.id} to={`/lab/${s.id}`}>
              <BookOpen aria-hidden="true" />
              {s.title}
              <ArrowRight aria-hidden="true" />
            </Link>
          ))
        )}
      </section>
    </div>
  )
}

import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  CornerDownRight,
  FlaskConical,
  Library,
  ShieldCheck,
} from 'lucide-react'
import { useStudies } from '@/hooks/useResearch'
import { api, keys } from '@/app/data'
import { suggestedQuestions } from '@/services/mock/fixtures'
import { emptyContext } from '@/types/research'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorState, Loading } from '@/components/shared'
import Composer from './Composer'
import { simulationApi } from '@/services/simulation'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const collection = useStudies()
  const simulationId = params.get('simulation')
  const simulation = useQuery({
    queryKey: [api.mode, 'simulation-context', simulationId],
    queryFn: ({ signal }) => simulationApi.getContext(simulationId!, signal),
    enabled: !!simulationId,
  })
  const sessionId = params.get('lab')
  const session = useQuery({
    queryKey: keys.session(sessionId ?? ''),
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  })
  const snapshot = session.data?.snapshots.find((s) => s.id === params.get('view')) ?? null
  const context = {
    ...emptyContext(),
    studyIds: [
      ...new Set([
        ...params.getAll('study'),
        ...(snapshot?.studyIds ?? []),
        ...(simulation.data?.studyIds ?? []),
      ]),
    ],
    datasetIds: snapshot?.datasets.map((d) => d.id) ?? [],
    labSnapshot: snapshot,
    simulationContext: simulation.data ?? null,
  }
  const draftId =
    params.get('draft') ??
    `home-${context.studyIds.join('-')}-${params.get('view') ?? ''}${simulationId ? `-${simulationId}` : ''}`
  return (
    <div className="page home-page">
      <div className="home-topline">
        <p className="eyebrow">
          <span className="tiny-rule" />
          Your research notebook
        </p>
        <Badge variant="outline">Explore → Understand → Experiment → Analyze</Badge>
      </div>
      <div className="home-intro">
        <h1 tabIndex={-1}>
          Begin with a<br />
          <em>research question.</em>
        </h1>
        <p>
          A considered workspace for combustion in microgravity.
          <br className="desktop-break" /> Explore investigations. Follow the evidence. Keep the
          context.
        </p>
      </div>
      {simulationId && simulation.isPending ? (
        <Loading label="Loading exact simulation context…" />
      ) : simulation.isError ? (
        <ErrorState error={simulation.error} retry={() => simulation.refetch()} />
      ) : sessionId && session.isPending ? (
        <Loading label="Loading saved Lab context…" />
      ) : session.isError || (sessionId && session.isSuccess && !snapshot) ? (
        <ErrorState
          error={
            session.error ??
            new Error('This saved view is unavailable. Return to Lab and save a new snapshot.')
          }
        />
      ) : (
        <Composer
          key={draftId}
          initialContext={context}
          draftId={draftId}
          prefill={params.get('question') ?? ''}
        />
      )}
      <div className="home-columns">
        <section aria-labelledby="inquiry-title">
          <div className="section-heading">
            <h2 id="inquiry-title">A starting point</h2>
            <ArrowDownRight aria-hidden="true" />
          </div>
          <div className="question-list">
            {suggestedQuestions.map((q) => (
              <button
                key={q.title}
                onClick={() => {
                  const next = new URLSearchParams()
                  q.studyIds.forEach((id) => next.append('study', id))
                  next.set('question', q.title)
                  next.set('draft', crypto.randomUUID())
                  setParams(next)
                  document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
                }}
              >
                <span className="question-icon">
                  <CornerDownRight aria-hidden="true" />
                </span>
                <span>
                  <strong>{q.title}</strong>
                  <small>{q.detail}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <Link className="quiet-link" to="/lab">
            <FlaskConical aria-hidden="true" />
            Prefer to explore? Open the Lab
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
        <section className="collection-preview" aria-labelledby="collection-title">
          <div className="section-heading">
            <h2 id="collection-title">Investigation index</h2>
            <Library aria-hidden="true" />
          </div>
          {collection.isPending ? (
            <Loading label="Loading investigation index…" />
          ) : collection.isError ? (
            <ErrorState error={collection.error} retry={() => collection.refetch()} />
          ) : (
            <>
              {collection.data.slice(0, 3).map((s) => (
                <Link key={s.id} to={`/resources/${s.id}`} className="collection-row">
                  <span className="investigation-code">{s.investigation}</span>
                  <span>{s.category}</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
              <Link className="quiet-link" to="/resources">
                <BookOpen aria-hidden="true" />
                Browse the research library
                <ArrowRight aria-hidden="true" />
              </Link>
              <p className="collection-note">
                Source-linked overviews.
                <br />
                Experimental measurements are not connected.
              </p>
            </>
          )}
        </section>
      </div>
      <div className="evidence-principle">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Evidence is part of the answer.</strong>
          <p>Sources, interpretations and missing data stay visible throughout your research.</p>
        </div>
        <Badge variant="secondary">Independent prototype</Badge>
      </div>
      <Button className="sr-only" asChild>
        <Link to="/settings">Workspace settings</Link>
      </Button>
    </div>
  )
}

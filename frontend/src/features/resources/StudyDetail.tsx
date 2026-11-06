import { useState } from 'react'
import ResourceInteractiveView from '@/features/simulation/ResourceInteractiveView'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FlaskConical,
  GitCompareArrows,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { api, refreshSessions } from '@/app/data'
import { newSession } from '@/lib/session'
import { emptyContext } from '@/types/research'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ErrorState, ExternalLink, Loading } from '@/components/shared'

export default function StudyDetail() {
  const { studyId = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const query = useQuery({
    queryKey: [api.mode, 'study', studyId],
    queryFn: () => api.getStudy(studyId),
  })
  if (query.isPending)
    return (
      <div className="page">
        <Loading label="Loading investigation…" />
      </div>
    )
  if (query.isError)
    return (
      <div className="page">
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </div>
    )
  const study = query.data
  return (
    <div className="page detail-page">
      <Link className="quiet-link back-link" to="/resources">
        <ArrowLeft aria-hidden="true" />
        Research library
      </Link>
      <div className="detail-title">
        <span className="investigation-code large-code">{study.investigation}</span>
        <p className="eyebrow">Investigation record</p>
        <h1 tabIndex={-1}>{study.title}</h1>
        <div className="detail-badges">
          <Badge variant="outline">{study.environment ?? 'Environment not reported'}</Badge>
          <span className="availability-text">
            <span className="outline-dot" />
            Measurements not connected
          </span>
        </div>
      </div>
      <div className="detail-actions">
        <Button asChild>
          <Link to={`/?study=${study.id}`}>
            <MessageSquare data-icon="inline-start" />
            Ask about this study
          </Link>
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const session = await api.saveSession(
                newSession({
                  ...emptyContext(),
                  studyIds: [study.id],
                  datasetIds: study.datasetIds,
                }),
              )
              await refreshSessions()
              navigate(`/lab/${session.id}`)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not save study context.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <FlaskConical data-icon="inline-start" />
          {busy ? 'Opening Lab…' : 'Open in Lab'}
        </Button>
        <Button variant="ghost" asChild>
          <Link to={`/resources?compare=${study.id}`}>
            <GitCompareArrows data-icon="inline-start" />
            Compare
          </Link>
        </Button>
      </div>
      {error ? (
        <p role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      <div className="detail-layout">
        <article>
          <section id="objective" className="detail-section">
            <p className="eyebrow">Research scope</p>
            <h2>Objective</h2>
            <p className="detail-lede">{study.objective ?? 'Research objective not provided.'}</p>
            <p className="muted">
              A high-level source summary. Detailed experimental conditions and numerical results
              have not been imported into this workspace.
            </p>
          </section>
          <section id="conditions" className="detail-section">
            <h2>Experimental context</h2>
            <dl className="metadata-grid">
              <div>
                <dt>Environment</dt>
                <dd>{study.environment ?? 'Not reported'}</dd>
              </div>
              <div>
                <dt>Research area</dt>
                <dd>{study.category}</dd>
              </div>
              <div>
                <dt>Materials</dt>
                <dd>{study.materials.join(', ') || 'Not provided by the connected source'}</dd>
              </div>
              <div>
                <dt>Instruments</dt>
                <dd>{study.instruments.join(', ') || 'Not provided by the connected source'}</dd>
              </div>
            </dl>
            {study.conditions.length ? (
              <dl className="metadata-list">
                {study.conditions.map((c) => (
                  <div key={c.id}>
                    <dt>{c.name}</dt>
                    <dd>
                      {c.value ?? c.missingReason ?? 'Not reported'} {c.unit}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="missing-field">
                Run-level conditions are not connected. Values must be obtained from the original
                experiment record.
              </p>
            )}
          </section>
          <section id="measurements" className="detail-section">
            <h2>Measurements and findings</h2>
            <div className="unavailable-block">
              <BookOpen aria-hidden="true" />
              <div>
                <strong>No numerical measurements connected</strong>
                <p>{study.fieldLimitations.measurements}</p>
                <p>{study.fieldLimitations.findings}</p>
              </div>
            </div>
          </section>
          <ResourceInteractiveView studyId={study.id} />
          <section id="files" className="detail-section">
            <h2>Available files</h2>
            <p className="muted">
              No files are connected to this record. Consult the original source for data access and
              availability.
            </p>
          </section>
          <section id="sources" className="detail-section">
            <h2>Original sources</h2>
            {study.sources.map((source) => (
              <div className="source-record" key={source.id}>
                <span className="source-symbol">
                  <BookOpen aria-hidden="true" />
                </span>
                <div>
                  <h3>{source.title}</h3>
                  <p>
                    {source.publisher} · {source.type.replaceAll('-', ' ')}
                  </p>
                  <ExternalLink url={source.url}>Open original source</ExternalLink>
                </div>
              </div>
            ))}
            <Alert>
              <ShieldCheck aria-hidden="true" />
              <AlertDescription>
                The linked source supports the investigation description. It does not validate an AI
                conclusion or a quantitative prediction.
              </AlertDescription>
            </Alert>
          </section>
          {study.relatedStudyIds.length ? (
            <section className="detail-section">
              <h2>Related investigations</h2>
              {study.relatedStudyIds.map((id) => (
                <Link className="related-link" to={`/resources/${id}`} key={id}>
                  {id.toUpperCase()}
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </section>
          ) : null}
        </article>
        <aside className="detail-aside">
          <p className="eyebrow">On this page</p>
          <nav aria-label="Study sections">
            {[
              ['objective', 'Objective'],
              ['conditions', 'Experimental context'],
              ['measurements', 'Measurements and findings'],
              ['interactive', 'Interactive View'],
              ['files', 'Available files'],
              ['sources', 'Original sources'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <div className="source-note">
            <ShieldCheck aria-hidden="true" />
            <strong>Know the limits.</strong>
            <p>
              Missing data stays missing. Research context is preserved when you move to the Lab.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

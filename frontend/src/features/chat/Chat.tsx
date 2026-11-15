import './chat.css'
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller'
import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Fingerprint,
  FlaskConical,
  MessageSquare,
} from 'lucide-react'
import { api, keys, refreshSessions } from '@/app/data'
import { usePreferences } from '@/app/Preferences'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorState, Loading } from '@/components/shared'
import { newSession } from '@/lib/session'
import type { ChatMessage } from '@/types/research'
import Composer from './Composer'
import { Message, MessageContent } from '@/components/ui/message'
import { Bubble, BubbleContent } from '@/components/ui/bubble'

const EvidencePanel = lazy(() => import('@/features/evidence/EvidencePanel'))
function MessageView({
  message,
  inspect,
}: {
  message: ChatMessage
  inspect: (id: string) => void
}) {
  const navigate = useNavigate()
  const { prefs } = usePreferences()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <article className={`research-message ${message.role}`}>
      <Message>
        <MessageContent>
          <div className="message-byline">
            {message.role === 'user' ? (
              <MessageSquare aria-hidden="true" />
            ) : (
              <span className="assistant-symbol" aria-hidden="true">
                F.
              </span>
            )}
            <strong>{message.role === 'user' ? 'You' : 'Fire-XII'}</strong>
            {message.generation === 'scripted-demo' ? (
              <Badge variant="outline">Scripted demonstration</Badge>
            ) : null}
          </div>
          <Bubble variant="ghost">
            <BubbleContent className="message-reading">
              <Markdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                  [rehypeKatex, { trust: false, strict: 'warn', maxSize: 20, maxExpand: 1000 }],
                ]}
                components={{
                  img: ({ alt }) => <span>{alt || 'External image'} · image not loaded</span>,
                }}
                skipHtml
              >
                {message.markdown}
              </Markdown>
            </BubbleContent>
          </Bubble>
          {message.attachments.length ? (
            <p className="attachment-history">
              <BookOpen aria-hidden="true" />
              {message.attachments.map((a) => a.name).join(', ')} ·{' '}
              {message.generation === 'scripted-demo'
                ? 'local metadata only'
                : 'uploaded research document'}
            </p>
          ) : null}
          {message.context.simulationContext ? (
            <div className="snapshot-reference">
              <FlaskConical aria-hidden="true" />
              <div>
                <strong>Illustrative / Not Scientifically Validated</strong>
                <p>
                  Captured Studio context · {message.context.simulationContext.modelId} v
                  {message.context.simulationContext.modelVersion} · step{' '}
                  {message.context.simulationContext.timestamp?.value ?? 'not run'} ·{' '}
                  {message.context.simulationContext.selectedComponentId ??
                    message.context.simulationContext.selectedMeasurement?.entityId ??
                    'No sample'}
                </p>
                <Link
                  className="text-link"
                  to={`/lab/studio/${message.context.simulationContext.sessionId}?run=${encodeURIComponent(message.context.simulationContext.runId ?? '')}&frame=${encodeURIComponent(message.context.simulationContext.frameId ?? '')}&view=${message.context.simulationContext.visualization}&entity=${encodeURIComponent(message.context.simulationContext.selectedComponentId ?? message.context.simulationContext.selectedMeasurement?.entityId ?? '')}`}
                >
                  Reopen exact Studio state
                </Link>
              </div>
            </div>
          ) : null}
          {message.context.labSnapshot ? (
            <div className="snapshot-reference">
              <FlaskConical aria-hidden="true" />
              <span>
                Saved view ·{' '}
                {message.context.labSnapshot.datasets.some((d) => d.origin === 'synthetic')
                  ? 'Synthetic demonstration, no physical interpretation'
                  : 'Study context; inspect data provenance'}{' '}
                ·{' '}
                {message.context.labSnapshot.selectedRowIds.length
                  ? `Selected: ${message.context.labSnapshot.selectedRowIds.join(', ')}`
                  : 'No sample selected'}
              </span>
            </div>
          ) : null}
          {message.evidence.length ? (
            <section className="message-evidence" aria-label="Supporting evidence">
              <div className="evidence-caption">
                <Fingerprint aria-hidden="true" />
                <span>Evidence trail</span>
                <span>Source-linked research context</span>
              </div>
              {message.evidence.map((e) => (
                <div className="evidence-record" key={e.id}>
                  <button
                    onClick={() => inspect(e.id)}
                    aria-label={`Inspect ${e.experimentName ?? 'unsupported'} evidence`}
                  >
                    <span className="evidence-index">
                      <FileEvidenceIcon />
                    </span>
                    <span>
                      <strong>{e.experimentName ?? 'Source unavailable'}</strong>
                      <small>{e.source?.title ?? 'No supporting source attached'}</small>
                    </span>
                    <Badge variant="secondary">{e.classification}</Badge>
                    <ArrowRight aria-hidden="true" />
                  </button>
                  {prefs.citations === 'expanded' ? (
                    <p className="expanded-source">
                      {e.passage}{' '}
                      <span>Provenance: {e.provenanceStatus}. Uncertainty not reported.</span>
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
          {message.role === 'assistant' && message.studyIds.length ? (
            <div className="message-studies">
              <span>Continue with</span>
              {message.studyIds.map((id) => (
                <Link to={`/resources/${id}`} key={id}>
                  {id.toUpperCase()}
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
              <Button
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const session = await api.saveSession(
                      newSession({ ...message.context, studyIds: message.studyIds }),
                    )
                    await refreshSessions()
                    navigate(`/lab/${session.id}`)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not open Lab.')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <FlaskConical data-icon="inline-start" />
                {busy ? 'Opening…' : 'Open in Lab'}
              </Button>
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="error-text">
              {error}
            </p>
          ) : null}
        </MessageContent>
      </Message>
    </article>
  )
}
function FileEvidenceIcon() {
  return <BookOpen aria-hidden="true" />
}
export default function Chat() {
  const { conversationId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const conversation = useQuery({
    queryKey: keys.conversation(conversationId),
    queryFn: () => api.getConversation(conversationId),
  })
  if (conversation.isPending)
    return (
      <div className="page">
        <Loading />
      </div>
    )
  if (conversation.isError)
    return (
      <div className="page">
        <ErrorState error={conversation.error} retry={() => conversation.refetch()} />
      </div>
    )
  const record = conversation.data
  const evidence = record.messages
    .flatMap((m) => m.evidence)
    .find((e) => e.id === params.get('evidence'))
  function inspect(id: string) {
    const next = new URLSearchParams(params)
    next.set('evidence', id)
    setParams(next)
  }
  return (
    <div className="page chat-page">
      <Link className="quiet-link back-link" to="/">
        <ArrowLeft aria-hidden="true" />
        Research workspace
      </Link>
      <div className="chat-title">
        <div>
          <p className="eyebrow">Research conversation</p>
          <h1 tabIndex={-1}>{record.title}</h1>
        </div>
        <Badge variant="outline">
          {api.mode === 'demo' ? 'Saved on this device' : 'Connected workspace'}
        </Badge>
      </div>
      <div className="conversation-document">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller>
            <MessageScrollerViewport aria-label="Research conversation transcript">
              <MessageScrollerContent>
                {record.messages.length ? (
                  record.messages.map((m) => (
                    <MessageScrollerItem
                      key={m.id}
                      messageId={m.id}
                      scrollAnchor={m.role === 'user'}
                    >
                      <MessageView message={m} inspect={inspect} />
                    </MessageScrollerItem>
                  ))
                ) : (
                  <MessageScrollerItem messageId="empty">
                    <p className="muted">Your question will begin this research notebook.</p>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label="Jump to latest" />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
      <Composer
        key={record.id}
        conversation={record}
        initialContext={record.context}
        draftId={record.id}
      />
      {params.has('evidence') ? (
        <Suspense fallback={<p role="status">Loading evidence…</p>}>
          <EvidencePanel
            requested
            evidence={evidence}
            close={() => {
              const next = new URLSearchParams(params)
              next.delete('evidence')
              setParams(next, { replace: true })
            }}
          />
        </Suspense>
      ) : null}
    </div>
  )
}

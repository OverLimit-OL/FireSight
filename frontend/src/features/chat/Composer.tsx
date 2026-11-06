import { validateFile } from '@/lib/attachments'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { ConfirmAction } from '@/components/shared'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ArrowUp, BookOpen, FileText, FlaskConical, Paperclip, Square, X } from 'lucide-react'
import { api, refreshConversations } from '@/app/data'
import { usePreferences } from '@/app/Preferences'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupTextarea, InputGroupAddon } from '@/components/ui/input-group'
import {
  Attachment,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from '@/components/ui/attachment'
import { contextSchema, attachmentSchema } from '@/types/research'
import type { Conversation, MessageAttachment, ResearchContext } from '@/types/research'
import { readStored, resetStored } from '@/lib/storage'

const draftSchema = z.object({
  text: z.string(),
  context: contextSchema,
  attachments: z.array(attachmentSchema),
})
function StudyChip({ id, remove }: { id: string; remove: () => void }) {
  const study = useQuery({ queryKey: [api.mode, 'study', id], queryFn: () => api.getStudy(id) })
  return (
    <span className="context-chip">
      <BookOpen aria-hidden="true" />
      <span>
        {study.data?.investigation ??
          (study.isError ? `Unavailable study: ${id}` : 'Loading study…')}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        type="button"
        aria-label={`Remove study ${study.data?.investigation ?? id}`}
        onClick={remove}
      >
        <X />
      </Button>
    </span>
  )
}
export default function Composer({
  initialContext,
  conversation,
  draftId,
  prefill = '',
}: {
  initialContext: ResearchContext
  conversation?: Conversation
  draftId: string
  prefill?: string
}) {
  const navigate = useNavigate()
  const { prefs } = usePreferences()
  const key = `firesight:draft:v1:${draftId}`
  const [initial] = useState(() => {
    try {
      return {
        ...readStored(key, draftSchema, {
          text: prefill,
          context: initialContext,
          attachments: [],
        }),
        error: '',
      }
    } catch (error) {
      return {
        text: prefill,
        context: initialContext,
        attachments: [],
        error: error instanceof Error ? error.message : 'Draft unavailable.',
      }
    }
  })
  const [text, setText] = useState(initial.text)
  const [context, setContext] = useState(initial.context)
  const [attachments, setAttachments] = useState<MessageAttachment[]>(
    initial.attachments.map((a) => ({ ...a, status: 'reselect-required' })),
  )
  const [error, setError] = useState(initial.error)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const staged = useRef(new Map<string, File>())
  const abort = useRef<AbortController | null>(null)
  const created = useRef<Conversation | null>(null)
  const operation = useRef(crypto.randomUUID())
  useEffect(() => () => abort.current?.abort(), [])
  const saveError = useDraftPersistence(
    key,
    { text, context, attachments: attachments.map((a) => ({ ...a, status: 'reselect-required' })) },
    !initial.error,
  )
  async function send() {
    if (busy) return
    if (!text.trim() || text.length > 12000) {
      setError('Enter a research question between 1 and 12,000 characters.')
      input.current?.focus()
      return
    }
    if (attachments.some((a) => a.status === 'reselect-required')) {
      setError(
        'Reselect or remove attachments before sending. File bytes are not retained after a reload.',
      )
      return
    }
    setError('')
    setBusy(true)
    const controller = new AbortController()
    abort.current = controller
    try {
      const record =
        conversation ??
        created.current ??
        (await api.createConversation(context, text.trim().slice(0, 72), operation.current))
      created.current = record
      await api.sendMessage(
        record.id,
        {
          text,
          context,
          localAttachments: attachments,
          clientMessageId: operation.current,
          revision: record.revision,
        },
        controller.signal,
        prefs.scenario,
      )
      setText('')
      setAttachments([])
      staged.current.clear()
      operation.current = crypto.randomUUID()
      resetStored(key)
      await refreshConversations()
      navigate(`/chat/${record.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The response failed. Your draft is preserved.')
    } finally {
      setBusy(false)
      abort.current = null
    }
  }
  return (
    <form
      className="composer-wrap"
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel className="sr-only" htmlFor={`question-${draftId}`}>
            Research question
          </FieldLabel>
          <InputGroup className="research-composer">
            <InputGroupTextarea
              ref={input}
              id={`question-${draftId}`}
              name="researchQuestion"
              placeholder="Ask a question about microgravity combustion…"
              value={text}
              maxLength={12000}
              aria-invalid={!!error}
              aria-describedby={`composer-help-${draftId}`}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void send()
                }
              }}
            />
            {context.studyIds.length ||
            context.labSnapshot ||
            context.simulationContext ||
            attachments.length ? (
              <InputGroupAddon align="block-end" className="context-row">
                {context.studyIds.map((id) => (
                  <StudyChip
                    key={id}
                    id={id}
                    remove={() =>
                      setContext((c) => ({ ...c, studyIds: c.studyIds.filter((s) => s !== id) }))
                    }
                  />
                ))}
                {context.labSnapshot ? (
                  <span className="context-chip">
                    <FlaskConical aria-hidden="true" />
                    <span>
                      {context.labSnapshot.datasets.some((d) => d.origin === 'synthetic')
                        ? 'Synthetic Lab view'
                        : 'Saved Lab context'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      aria-label="Remove Lab context"
                      onClick={() =>
                        setContext((c) => ({ ...c, labSnapshot: null, datasetIds: [] }))
                      }
                    >
                      <X />
                    </Button>
                  </span>
                ) : null}
                {context.simulationContext ? (
                  <span className="context-chip">
                    <FlaskConical aria-hidden="true" />
                    <span>
                      Illustrative Studio · step{' '}
                      {context.simulationContext.timestamp?.value ?? 'not run'} ·{' '}
                      {context.simulationContext.selectedComponentId ??
                        context.simulationContext.selectedMeasurement?.entityId ??
                        'No sample'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="button"
                      aria-label="Remove simulation context"
                      onClick={() => setContext((c) => ({ ...c, simulationContext: null }))}
                    >
                      <X />
                    </Button>
                  </span>
                ) : null}
                {attachments.map((a) => (
                  <Attachment key={a.id} size="xs" state="idle">
                    <FileText aria-hidden="true" />
                    <AttachmentContent>
                      <AttachmentTitle>{a.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {a.status === 'reselect-required'
                          ? 'Reselect required'
                          : 'Staged locally · unprocessed'}
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction
                        type="button"
                        aria-label={`Remove attachment ${a.name}`}
                        onClick={() => {
                          staged.current.delete(a.id)
                          setAttachments((items) => items.filter((item) => item.id !== a.id))
                        }}
                      >
                        <X />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </InputGroupAddon>
            ) : null}
            <InputGroupAddon align="block-end" className="composer-toolbar">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => picker.current?.click()}
              >
                <Paperclip data-icon="inline-start" />
                Attach files
              </Button>
              <span className="composer-shortcut">
                {text.length > 11000 ? `${text.length}/12,000` : 'Ctrl / ⌘ + Enter'}
              </span>
              {busy ? (
                <Button variant="outline" type="button" onClick={() => abort.current?.abort()}>
                  <Square data-icon="inline-start" />
                  Cancel
                </Button>
              ) : (
                <Button type="submit" aria-label="Send research question" className="send-button">
                  <span>Send</span>
                  <ArrowUp data-icon="inline-end" />
                </Button>
              )}
            </InputGroupAddon>
          </InputGroup>
          {error ? (
            <p role="alert" className="error-text">
              {error}
            </p>
          ) : null}
        </Field>
      </FieldGroup>
      <input
        ref={picker}
        type="file"
        multiple
        accept=".pdf,.csv,.txt,.json"
        className="sr-only"
        aria-label="Choose research attachments"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          const next = attachments.map((a) => ({ ...a }))
          const errors: string[] = []
          for (const file of files) {
            const invalid = validateFile(file)
            if (invalid) {
              errors.push(`${file.name}: ${invalid}`)
              continue
            }
            const existing = next.find((a) => a.name === file.name && a.byteSize === file.size)
            if (existing?.status === 'reselect-required') {
              staged.current.set(existing.id, file)
              existing.status = 'staged-local'
              continue
            }
            if (existing) {
              errors.push(`${file.name} is already staged.`)
              continue
            }
            if (next.length >= 5) {
              errors.push('Stage up to five files at a time.')
              break
            }
            const id = crypto.randomUUID()
            staged.current.set(id, file)
            next.push({
              id,
              name: file.name,
              mediaType: file.type || null,
              byteSize: file.size,
              status: 'staged-local',
              serverFileId: null,
              error: null,
            })
          }
          setAttachments(next)
          setError(errors.join(' '))
          e.target.value = ''
        }}
      />
      <div className="composer-help" id={`composer-help-${draftId}`}>
        <span>
          {api.mode === 'demo'
            ? 'Demo responses are scripted. Files are staged locally and never processed.'
            : 'File upload is not enabled. Staged files must be removed before sending.'}
        </span>
        <span className="mono">PDF · CSV · TXT · JSON</span>
      </div>
      {initial.error ? (
        <ConfirmAction
          title="Reset unreadable draft?"
          description="This removes only the unreadable draft for this conversation. Saved messages and other workspaces are retained."
          actionLabel="Reset draft"
          trigger={
            <Button variant="outline" type="button">
              Reset unreadable draft…
            </Button>
          }
          onConfirm={() => {
            resetStored(key)
            window.location.reload()
          }}
        />
      ) : null}
      {saveError ? (
        <p className="error-text" role="status">
          {saveError}
        </p>
      ) : null}
      <p className="sr-only" role="status">
        {busy ? 'Preparing a scripted response…' : ''}
      </p>
    </form>
  )
}

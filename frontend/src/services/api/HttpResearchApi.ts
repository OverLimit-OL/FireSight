import { z } from 'zod'
import {
  APIError,
  conversationSchema,
  datasetSchema,
  messageSchema,
  rowSchema,
  sessionSchema,
  studySchema,
} from '@/types/research'
import type { LabSession, ResearchContext } from '@/types/research'
import type { ResearchApi, SendInput } from './ResearchApi'

export class HttpResearchApi implements ResearchApi {
  readonly mode = 'http' as const
  private baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  private async request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1${path}`, {
        ...init,
        headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        throw new APIError(
          'ABORTED',
          'Request cancelled. Server completion is unknown; reload before retrying.',
        )
      throw new APIError(
        'UNAVAILABLE',
        'The research API could not be reached. Check the API connection and retry.',
        true,
      )
    }
    if (response.status === 204) return schema.parse(undefined)
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new APIError(
        'INVALID_RESPONSE',
        'The API returned a non-JSON response. Check the API URL and host routing.',
      )
    }
    if (!response.ok) {
      const parsed = z.object({ error: z.object({ message: z.string() }) }).safeParse(body)
      throw new APIError(
        response.status === 404
          ? 'NOT_FOUND'
          : response.status === 409
            ? 'CONFLICT'
            : response.status === 422
              ? 'VALIDATION_ERROR'
              : 'UNAVAILABLE',
        parsed.success ? parsed.data.error.message : `API request failed (${response.status}).`,
        response.status >= 500,
      )
    }
    const result = z.object({ data: schema }).safeParse(body)
    if (!result.success)
      throw new APIError(
        'INVALID_RESPONSE',
        'The API response did not match the documented contract. No demonstration data was substituted.',
      )
    return result.data.data
  }
  private async list<T>(path: string, schema: z.ZodType<T>): Promise<T[]> {
    const all: T[] = []
    const cursors = new Set<string>()
    let cursor: string | null = null
    do {
      const separator = path.includes('?') ? '&' : '?'
      const page: { items: T[]; nextCursor: string | null } = await this.request(
        `${path}${separator}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        z.object({ items: z.array(schema), nextCursor: z.string().nullable() }),
      )
      all.push(...page.items)
      cursor = page.nextCursor
      if (cursor && cursors.has(cursor))
        throw new APIError('INVALID_RESPONSE', 'The API repeated a pagination cursor.')
      if (cursor) cursors.add(cursor)
      if (all.length > 10000)
        throw new APIError(
          'UNSUPPORTED_DATA',
          'This collection exceeds the bounded client view. Use a smaller dataset or add server-side pagination support.',
        )
    } while (cursor)
    return all
  }
  listStudies() {
    return this.list('/resources', studySchema)
  }
  getStudy(id: string) {
    return this.request(`/resources/${encodeURIComponent(id)}`, studySchema)
  }
  listConversations() {
    return this.list(
      '/conversations',
      conversationSchema.extend({ messages: z.array(messageSchema).default([]) }),
    )
  }
  getConversation(id: string) {
    return this.request(`/conversations/${encodeURIComponent(id)}`, conversationSchema)
  }
  createConversation(context: ResearchContext, title: string, operationId = crypto.randomUUID()) {
    return this.request('/conversations', conversationSchema, {
      method: 'POST',
      headers: { 'Idempotency-Key': operationId },
      body: JSON.stringify({ title, context }),
    })
  }
  async renameConversation(id: string, title: string, revision: number) {
    await this.request(`/conversations/${encodeURIComponent(id)}`, conversationSchema, {
      method: 'PATCH',
      body: JSON.stringify({ title, revision }),
    })
  }
  async deleteConversation(id: string, revision: number) {
    await this.request(`/conversations/${encodeURIComponent(id)}`, z.undefined(), {
      method: 'DELETE',
      headers: { 'If-Match': `"${revision}"` },
    })
  }
  sendMessage(id: string, input: SendInput, signal?: AbortSignal) {
    if (input.localAttachments.some((a) => a.status !== 'uploaded'))
      return Promise.reject(
        new APIError(
          'UNSUPPORTED_DATA',
          'File upload is not enabled in this frontend. Remove staged files before sending to Flask.',
        ),
      )
    return this.request(
      `/conversations/${encodeURIComponent(id)}/messages`,
      z.object({
        userMessage: messageSchema,
        assistantMessage: messageSchema,
        conversationRevision: z.number(),
      }),
      {
        method: 'POST',
        signal,
        headers: { 'Idempotency-Key': input.clientMessageId },
        body: JSON.stringify({
          text: input.text,
          context: input.context,
          fileIds: input.localAttachments.map((a) => a.serverFileId),
          clientMessageId: input.clientMessageId,
          revision: input.revision,
        }),
      },
    )
  }
  listSessions() {
    return this.list('/lab/sessions', sessionSchema)
  }
  getSession(id: string) {
    return this.request(`/lab/sessions/${encodeURIComponent(id)}`, sessionSchema)
  }
  async saveSession(session: LabSession): Promise<LabSession> {
    const saved = await this.request(
      session.revision ? `/lab/sessions/${encodeURIComponent(session.id)}` : '/lab/sessions',
      sessionSchema,
      {
        method: session.revision ? 'PATCH' : 'POST',
        headers: session.revision ? {} : { 'Idempotency-Key': session.id },
        body: JSON.stringify(
          session.revision
            ? {
                title: session.title,
                revision: session.revision,
                context: session.context,
                visualization: session.visualization,
                selectedRowIds: session.selectedRowIds,
                notes: session.notes,
                appendSnapshot: session.snapshots.at(-1) ?? null,
              }
            : {
                title: session.title,
                context: session.context,
                visualization: session.visualization,
                notes: session.notes,
              },
        ),
      },
    )
    if (!session.revision && session.snapshots.length) {
      return this.saveSession({
        ...saved,
        snapshots: session.snapshots,
        selectedRowIds: session.selectedRowIds,
      })
    }
    return saved
  }
  getDataset(id: string) {
    return this.request(`/datasets/${encodeURIComponent(id)}`, datasetSchema)
  }
  getRows(id: string, revision: string) {
    return this.list(
      `/datasets/${encodeURIComponent(id)}/rows?revision=${encodeURIComponent(revision)}`,
      rowSchema,
    )
  }
}

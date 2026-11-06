import { z } from 'zod'
import { APIError } from '@/types/research'
import {
  analysisContextSchema,
  frameSchema,
  modelSchema,
  resourcePreviewSchema,
  runSchema,
  sessionSimulationSchema,
} from '@/types/simulation'
import type { AIAnalysisContext } from '@/types/simulation'
import type { SimulationApi } from './SimulationApi'
const enc = encodeURIComponent
export class HttpSimulationApi implements SimulationApi {
  readonly mode = 'http' as const
  private readonly baseUrl: string
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
    } catch (e) {
      throw new APIError(
        e instanceof DOMException && e.name === 'AbortError' ? 'ABORTED' : 'UNAVAILABLE',
        'Simulation API request did not complete. No demo result was substituted.',
        true,
      )
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new APIError('INVALID_RESPONSE', 'Simulation API did not return JSON.')
    }
    if (!response.ok) {
      const error = z.object({ error: z.object({ message: z.string() }) }).safeParse(body)
      throw new APIError(
        response.status === 404
          ? 'NOT_FOUND'
          : response.status === 409
            ? 'CONFLICT'
            : response.status === 422
              ? 'VALIDATION_ERROR'
              : 'UNAVAILABLE',
        error.success ? error.data.error.message : `Simulation API error (${response.status}).`,
        response.status >= 500,
      )
    }
    const result = z.object({ data: schema }).safeParse(body)
    if (!result.success)
      throw new APIError(
        'INVALID_RESPONSE',
        'Simulation response did not match simulation.v1. No fixture data was substituted.',
      )
    return result.data.data
  }
  private async list<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal) {
    const result: T[] = []
    const visited = new Set<string>()
    let cursor: string | null = null
    do {
      const page: { items: T[]; nextCursor: string | null } = await this.request(
        `${path}${path.includes('?') ? '&' : '?'}limit=100${cursor ? `&cursor=${enc(cursor)}` : ''}`,
        z.object({ items: z.array(schema), nextCursor: z.string().nullable() }),
        { signal },
      )
      result.push(...page.items)
      cursor = page.nextCursor
      if (cursor && visited.has(cursor))
        throw new APIError('INVALID_RESPONSE', 'Repeated simulation pagination cursor.')
      if (cursor) visited.add(cursor)
      if (result.length > 10000)
        throw new APIError(
          'UNSUPPORTED_DATA',
          'Output exceeds the bounded client view. Request a smaller recording.',
        )
    } while (cursor)
    return result
  }
  listModels(signal?: AbortSignal) {
    return this.list('/simulation-models', modelSchema, signal)
  }
  getModel(id: string, version: string, signal?: AbortSignal) {
    return this.request(`/simulation-models/${enc(id)}?version=${enc(version)}`, modelSchema, {
      signal,
    })
  }
  listSessions(signal?: AbortSignal) {
    return this.list('/simulation-sessions', sessionSimulationSchema, signal)
  }
  getSession(id: string, signal?: AbortSignal) {
    return this.request(`/simulation-sessions/${enc(id)}`, sessionSimulationSchema, { signal })
  }
  createSession(input: Parameters<SimulationApi['createSession']>[0]) {
    return this.request('/simulation-sessions', sessionSimulationSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }
  saveSession(id: string, input: Parameters<SimulationApi['saveSession']>[1]) {
    return this.request(`/simulation-sessions/${enc(id)}`, sessionSimulationSchema, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }
  listRuns(id: string, signal?: AbortSignal) {
    return this.list(`/simulation-sessions/${enc(id)}/runs`, runSchema, signal)
  }
  submitRun(id: string, revisionId: string, operationId: string) {
    return this.request(`/simulation-sessions/${enc(id)}/runs`, runSchema, {
      method: 'POST',
      headers: { 'Idempotency-Key': operationId },
      body: JSON.stringify({ revisionId }),
    })
  }
  getRun(id: string, signal?: AbortSignal) {
    return this.request(`/simulation-runs/${enc(id)}`, runSchema, { signal })
  }
  cancelRun(id: string) {
    return this.request(`/simulation-runs/${enc(id)}/cancel`, runSchema, { method: 'POST' })
  }
  getFrames(id: string, signal?: AbortSignal) {
    return this.list(`/simulation-runs/${enc(id)}/frames`, frameSchema, signal)
  }
  getResourcePreview(id: string, signal?: AbortSignal) {
    return this.request(`/resources/${enc(id)}/simulation`, resourcePreviewSchema, { signal })
  }
  captureContext(input: AIAnalysisContext) {
    return this.request('/simulation-contexts', analysisContextSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }
  getContext(id: string, signal?: AbortSignal) {
    return this.request(`/simulation-contexts/${enc(id)}`, analysisContextSchema, { signal })
  }
}

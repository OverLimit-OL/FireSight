import { z } from 'zod'
import { readStored, writeStored } from '@/lib/storage'
import { APIError } from '@/types/research'
import {
  analysisContextSchema,
  configurationSchema,
  frameSchema,
  runSchema,
  sessionSimulationSchema,
  terminalRun,
} from '@/types/simulation'
import type { AIAnalysisContext, ExperimentConfiguration, SimulationRun } from '@/types/simulation'
import type { SimulationApi } from './SimulationApi'
import { illustrativeModel } from '@/services/mock/simulation/model'
import reference from '@/services/mock/simulation/reference.json'
import offset from '@/services/mock/simulation/offset.json'
const key = 'firesight:simulation:v1'
const stateSchema = z.object({
  sessions: z.array(sessionSimulationSchema),
  runs: z.array(runSchema),
  contexts: z.array(analysisContextSchema),
})
const load = () => readStored(key, stateSchema, { sessions: [], runs: [], contexts: [] })
const now = () => new Date().toISOString()
function requireRecord<T>(value: T | undefined): T {
  if (!value)
    throw new APIError(
      'NOT_FOUND',
      'Simulation record not found. It may belong to another browser or have been removed.',
    )
  return value
}
export async function configurationDigest(configuration: ExperimentConfiguration) {
  const canonical = JSON.stringify(configurationSchema.parse(configuration))
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}
function assertVersion(actual: number, requested: number) {
  if (actual !== requested)
    throw new APIError(
      'CONFLICT',
      'This experiment changed in another tab. Reload before saving; your draft is retained.',
    )
}
export class MockSimulationApi implements SimulationApi {
  readonly mode = 'demo' as const
  async listModels() {
    return [structuredClone(illustrativeModel)]
  }
  async getModel(id: string, version: string) {
    if (id !== illustrativeModel.id || version !== illustrativeModel.version)
      throw new APIError(
        'NOT_FOUND',
        'This exact model version is unavailable. No replacement was selected.',
      )
    return structuredClone(illustrativeModel)
  }
  async listSessions() {
    return load().sessions.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  async getSession(id: string) {
    return requireRecord(load().sessions.find((s) => s.id === id))
  }
  async createSession(input: Parameters<SimulationApi['createSession']>[0]) {
    await this.getModel(input.modelId, input.modelVersion)
    const configuration = configurationSchema.parse(input.configuration)
    const digest = await configurationDigest(configuration)
    const state = load()
    if (input.parent) {
      const parent = requireRecord(state.sessions.find((s) => s.id === input.parent!.sessionId))
      requireRecord(parent.revisions.find((r) => r.id === input.parent!.revisionId))
    }
    const date = now()
    const session = sessionSimulationSchema.parse({
      schemaVersion: 'simulation.v1',
      id: crypto.randomUUID(),
      version: 1,
      title: input.title,
      modelId: input.modelId,
      modelVersion: input.modelVersion,
      createdAt: date,
      updatedAt: date,
      parent: input.parent ?? null,
      studyIds: input.studyIds,
      notes: '',
      revisions: [
        {
          id: crypto.randomUUID(),
          number: 1,
          createdAt: date,
          modelId: input.modelId,
          modelVersion: input.modelVersion,
          configuration,
          configurationDigest: digest,
        },
      ],
    })
    writeStored(key, { ...state, sessions: [...state.sessions, session] })
    return session
  }
  async saveSession(id: string, input: Parameters<SimulationApi['saveSession']>[1]) {
    const digest = input.configuration ? await configurationDigest(input.configuration) : null
    const state = load()
    const previous = requireRecord(state.sessions.find((s) => s.id === id))
    assertVersion(previous.version, input.version)
    const last = previous.revisions.at(-1)!
    const changed = digest && digest !== last.configurationDigest
    const saved = sessionSimulationSchema.parse({
      ...previous,
      title: input.title,
      notes: input.notes,
      updatedAt: now(),
      version: previous.version + 1,
      revisions: changed
        ? [
            ...previous.revisions,
            {
              ...last,
              id: crypto.randomUUID(),
              createdAt: now(),
              number: last.number + 1,
              configuration: input.configuration,
              configurationDigest: digest,
            },
          ]
        : previous.revisions,
    })
    writeStored(key, { ...state, sessions: state.sessions.map((s) => (s.id === id ? saved : s)) })
    return saved
  }
  async submitRun(
    sessionId: string,
    revisionId: string,
    operationId: string,
    outcome: 'complete' | 'fail' = 'complete',
  ) {
    const state = load()
    const existing = state.runs.find((r) => r.id === operationId)
    if (existing) {
      if (existing.sessionId !== sessionId || existing.revisionId !== revisionId)
        throw new APIError('CONFLICT', 'An idempotency key was reused with different inputs.')
      return existing
    }
    const session = requireRecord(state.sessions.find((s) => s.id === sessionId))
    const revision = requireRecord(session.revisions.find((r) => r.id === revisionId))
    const run: SimulationRun = {
      id: operationId,
      sessionId,
      revisionId,
      modelId: session.modelId,
      modelVersion: session.modelVersion,
      configurationDigest: revision.configurationDigest,
      status: 'queued',
      origin: 'illustrative',
      createdAt: now(),
      updatedAt: now(),
      completedAt: null,
      error: null,
      demoOutcome: outcome,
      warnings: [
        {
          code: 'ILLUSTRATIVE',
          message: 'Scripted fixture loading. No numerical computation is performed.',
        },
      ],
      provenance: structuredClone(illustrativeModel.provenance),
      fixtureId: revision.configuration.sequenceId,
    }
    writeStored(key, { ...state, runs: [...state.runs, run] })
    return run
  }
  async listRuns(sessionId: string) {
    const ids = load()
      .runs.filter((r) => r.sessionId === sessionId)
      .map((r) => r.id)
    return Promise.all(ids.map((id) => this.getRun(id)))
  }
  async getRun(id: string) {
    const state = load()
    const previous = requireRecord(state.runs.find((r) => r.id === id))
    if (terminalRun(previous.status)) return previous
    const elapsed = Date.now() - new Date(previous.createdAt).getTime()
    const status =
      elapsed < 450
        ? 'queued'
        : elapsed < 1600
          ? 'running'
          : previous.demoOutcome === 'fail'
            ? 'failed'
            : 'completed'
    if (status === previous.status) return previous
    const run: SimulationRun = {
      ...previous,
      status,
      updatedAt: now(),
      completedAt: terminalRun(status) ? now() : null,
      error:
        status === 'failed'
          ? 'Simulated job failure. Your configuration is preserved; choose Complete normally and run again.'
          : null,
    }
    writeStored(key, { ...state, runs: state.runs.map((r) => (r.id === id ? run : r)) })
    return run
  }
  async cancelRun(id: string) {
    // Refresh first: completion wins a race against a late cancellation.
    const current = await this.getRun(id)
    if (terminalRun(current.status)) return current
    const state = load()
    const run: SimulationRun = { ...current, status: 'cancelled', updatedAt: now() }
    writeStored(key, { ...state, runs: state.runs.map((r) => (r.id === id ? run : r)) })
    return run
  }
  async getFrames(runId: string) {
    const run = await this.getRun(runId)
    if (run.status !== 'completed')
      throw new APIError(
        'UNSUPPORTED_DATA',
        'Frames are available only for a completed fixture run.',
      )
    const fixture =
      run.fixtureId === 'reference' ? reference : run.fixtureId === 'offset' ? offset : null
    if (!fixture) throw new APIError('NOT_FOUND', 'The pinned fixture is unavailable.')
    return fixture.frames.map((frame) =>
      frameSchema.parse({
        ...frame,
        id: `${run.id}:${frame.id}`,
        runId,
        revisionId: run.revisionId,
        modelVersion: run.modelVersion,
        field: {
          id: 'scalar',
          label: 'Illustrative scalar',
          unit: 'dimensionless',
          domain: [0, 1],
          spatialRank: 3,
          coordinateUnit: 'dimensionless',
        },
      }),
    )
  }
  async getResourcePreview(_studyId: string) {
    return {
      status: 'unavailable' as const,
      reason:
        'This investigation has source-linked overview information, but no recorded frames, reconstruction data or validated model is connected. A faithful interactive reconstruction is unavailable.',
    }
  }
  async captureContext(context: AIAnalysisContext) {
    const parsed = analysisContextSchema.parse(context)
    const session = await this.getSession(parsed.sessionId)
    const revision = requireRecord(session.revisions.find((r) => r.id === parsed.revisionId))
    if (
      session.modelId !== parsed.modelId ||
      session.modelVersion !== parsed.modelVersion ||
      revision.configurationDigest !== parsed.configurationDigest
    )
      throw new APIError('VALIDATION_ERROR', 'Context does not match the saved configuration.')
    if (parsed.origin !== illustrativeModel.origin)
      throw new APIError('VALIDATION_ERROR', 'The origin does not match this illustrative model.')
    if (parsed.runId) {
      const run = await this.getRun(parsed.runId)
      if (
        run.sessionId !== parsed.sessionId ||
        run.revisionId !== parsed.revisionId ||
        run.configurationDigest !== parsed.configurationDigest ||
        run.modelVersion !== parsed.modelVersion ||
        run.origin !== parsed.origin
      )
        throw new APIError('VALIDATION_ERROR', 'Analysis context does not match the pinned run.')
      if (parsed.frameId) {
        const frames = await this.getFrames(run.id)
        const frame = requireRecord(frames.find((f) => f.id === parsed.frameId))
        if (
          frame.coordinate.value !== parsed.timestamp?.value ||
          frame.coordinate.unit !== parsed.timestamp?.unit
        )
          throw new APIError('VALIDATION_ERROR', 'Timestamp does not match the selected frame.')
        if (
          parsed.selectedMeasurement &&
          !frame.measurements.some(
            (m) => JSON.stringify(m) === JSON.stringify(parsed.selectedMeasurement),
          )
        )
          throw new APIError('VALIDATION_ERROR', 'Selected measurement is not part of this frame.')
      } else if (parsed.timestamp !== null || parsed.selectedMeasurement !== null)
        throw new APIError(
          'VALIDATION_ERROR',
          'A job without a selected frame cannot contain output measurements.',
        )
    } else if (
      parsed.frameId !== null ||
      parsed.timestamp !== null ||
      parsed.selectedMeasurement !== null
    ) {
      throw new APIError(
        'VALIDATION_ERROR',
        'A configuration-only context cannot contain output measurements.',
      )
    }
    const state = load()
    writeStored(key, { ...state, contexts: [...state.contexts, parsed] })
    return parsed
  }
  async getContext(id: string) {
    return requireRecord(load().contexts.find((c) => c.id === id))
  }
}

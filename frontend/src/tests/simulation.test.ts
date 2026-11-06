/// <reference types="node" />
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MockSimulationApi } from '@/services/simulation/MockSimulationApi'
import { HttpSimulationApi } from '@/services/simulation/HttpSimulationApi'
import { illustrativeModel } from '@/services/mock/simulation/model'
import { contextSchema, emptyContext } from '@/types/research'
import { assertFrameIdentity, assertRunIdentity } from '@/services/simulation/identity'
import { scientificMode } from '@/types/simulation'
const api = new MockSimulationApi()
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('crypto', webcrypto)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
const create = () =>
  api.createSession({
    title: 'Traceability test',
    modelId: illustrativeModel.id,
    modelVersion: illustrativeModel.version,
    configuration: { sequenceId: 'reference' },
    studyIds: ['bass'],
  })
async function complete(sessionId: string, revisionId: string, id = crypto.randomUUID()) {
  const run = await api.submitRun(sessionId, revisionId, id)
  vi.useFakeTimers()
  vi.setSystemTime(Date.now() + 2000)
  return api.getRun(run.id)
}
describe('simulation traceability', () => {
  it('pins immutable revisions and keeps old results associated with original configuration', async () => {
    const session = await create()
    const run = await complete(session.id, session.revisions[0].id)
    const saved = await api.saveSession(session.id, {
      version: session.version,
      title: session.title,
      notes: '',
      configuration: { sequenceId: 'offset' },
    })
    expect(saved.revisions).toHaveLength(2)
    expect(saved.revisions[0]).toEqual(session.revisions[0])
    expect(saved.revisions[1].configurationDigest).not.toBe(saved.revisions[0].configurationDigest)
    expect((await api.getRun(run.id)).revisionId).toBe(session.revisions[0].id)
    expect((await api.getFrames(run.id))[0].measurements[0].value).toBe(0.105)
  })
  it('rejects stale writes without changing saved notes', async () => {
    const session = await create()
    await api.saveSession(session.id, { version: 1, title: session.title, notes: 'New note' })
    await expect(
      api.saveSession(session.id, { version: 1, title: session.title, notes: 'Stale note' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    expect((await api.getSession(session.id)).notes).toBe('New note')
  })
  it('does not create a new configuration revision for notes or identical inputs', async () => {
    const session = await create()
    const saved = await api.saveSession(session.id, {
      version: 1,
      title: 'Renamed',
      notes: 'Author note',
      configuration: { sequenceId: 'reference' },
    })
    expect(saved.revisions).toHaveLength(1)
    expect(saved.title).toBe('Renamed')
  })
  it('forks with a parent reference and fresh IDs without inheriting runs', async () => {
    const session = await create()
    await complete(session.id, session.revisions[0].id)
    const fork = await api.createSession({
      title: 'Fork',
      modelId: session.modelId,
      modelVersion: session.modelVersion,
      configuration: { sequenceId: 'reference' },
      studyIds: session.studyIds,
      parent: { sessionId: session.id, revisionId: session.revisions[0].id },
    })
    expect(fork.id).not.toBe(session.id)
    expect(fork.revisions[0].id).not.toBe(session.revisions[0].id)
    expect(fork.parent?.revisionId).toBe(session.revisions[0].id)
    expect(await api.listRuns(fork.id)).toEqual([])
  })
  it('deduplicates run submissions and rejects changed idempotency inputs', async () => {
    const session = await create()
    const first = await api.submitRun(session.id, session.revisions[0].id, 'operation')
    expect(await api.submitRun(session.id, session.revisions[0].id, 'operation')).toEqual(first)
    const saved = await api.saveSession(session.id, {
      version: 1,
      title: session.title,
      notes: '',
      configuration: { sequenceId: 'offset' },
    })
    await expect(
      api.submitRun(session.id, saved.revisions[1].id, 'operation'),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })
  it('cancels a pending job without producing frames, while completion wins a late cancel', async () => {
    const session = await create()
    const pending = await api.submitRun(session.id, session.revisions[0].id, 'cancel')
    expect((await api.cancelRun(pending.id)).status).toBe('cancelled')
    await expect(api.getFrames(pending.id)).rejects.toMatchObject({ code: 'UNSUPPORTED_DATA' })
    const completed = await complete(session.id, session.revisions[0].id)
    expect((await api.cancelRun(completed.id)).status).toBe('completed')
  })
  it('reports a scripted failure with no invented results', async () => {
    const session = await create()
    const run = await api.submitRun(session.id, session.revisions[0].id, 'failure', 'fail')
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 2000)
    expect((await api.getRun(run.id)).status).toBe('failed')
    await expect(api.getFrames(run.id)).rejects.toMatchObject({ code: 'UNSUPPORTED_DATA' })
  })
  it('preserves sparse frame identity and missing samples in actual rank-three fixtures', async () => {
    const session = await create()
    const run = await complete(session.id, session.revisions[0].id)
    const frames = await api.getFrames(run.id)
    expect(frames).toHaveLength(9)
    expect(frames[4].id).toContain('step-9')
    expect(frames[4].coordinate.value).toBe(4)
    expect(frames[4].measurements.find((m) => m.entityId === 'p-111')?.value).toBeNull()
    expect(new Set(frames[0].measurements.map((m) => m.coordinates[2])).size).toBe(3)
  })
  it('captures immutable AI context and survives the existing research schema', async () => {
    const session = await create()
    const run = await complete(session.id, session.revisions[0].id)
    const frame = (await api.getFrames(run.id))[4]
    const context = await api.captureContext({
      schemaVersion: 'simulation.v1',
      id: 'context',
      capturedAt: new Date().toISOString(),
      sessionId: session.id,
      sessionTitle: session.title,
      modelId: run.modelId,
      modelVersion: run.modelVersion,
      revisionId: run.revisionId,
      configurationDigest: run.configurationDigest,
      runId: run.id,
      frameId: frame.id,
      timestamp: frame.coordinate,
      visualization: 'slice',
      selectedMeasurement: frame.measurements.find((m) => m.entityId === 'p-111')!,
      origin: 'illustrative',
      studyIds: session.studyIds,
      evidenceIds: [],
      limitations: illustrativeModel.limitations,
    })
    await api.saveSession(session.id, {
      version: 1,
      title: session.title,
      notes: '',
      configuration: { sequenceId: 'offset' },
    })
    expect(await api.getContext(context.id)).toEqual(context)
    expect(
      contextSchema.parse({ ...emptyContext(), simulationContext: context }).simulationContext,
    ).toEqual(context)
    await expect(
      api.captureContext({ ...context, id: 'bad', configurationDigest: 'wrong' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
  it('does not promote a catalog validation flag to validated run applicability', () => {
    expect(
      scientificMode({
        ...illustrativeModel,
        origin: 'computed',
        validation: { status: 'validated', scope: 'Unknown', evidence: [] },
      }),
    ).toContain('Not Scientifically Validated')
    expect(scientificMode({ ...illustrativeModel, origin: 'recorded' })).toBe('Recorded Experiment')
  })
  it('rejects unavailable model versions and leaves missing resource reconstruction explicit', async () => {
    await expect(api.getModel(illustrativeModel.id, 'missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    expect((await api.getResourcePreview('bass')).status).toBe('unavailable')
  })
  it('captures configuration and unfinished-job questions without manufacturing output', async () => {
    const session = await create()
    const revision = session.revisions[0]
    const context = {
      schemaVersion: 'simulation.v1' as const,
      id: 'before-run',
      capturedAt: new Date().toISOString(),
      sessionId: session.id,
      sessionTitle: session.title,
      modelId: session.modelId,
      modelVersion: session.modelVersion,
      revisionId: revision.id,
      configurationDigest: revision.configurationDigest,
      runId: null,
      frameId: null,
      timestamp: null,
      visualization: 'slice' as const,
      selectedMeasurement: null,
      origin: 'illustrative' as const,
      studyIds: session.studyIds,
      evidenceIds: [],
      limitations: illustrativeModel.limitations,
    }
    expect((await api.captureContext(context)).runId).toBeNull()
    const job = await api.submitRun(session.id, revision.id, 'pending-job')
    expect(
      (await api.captureContext({ ...context, id: 'pending-context', runId: job.id })).frameId,
    ).toBeNull()
    await expect(
      api.captureContext({
        ...context,
        id: 'fake-value',
        selectedMeasurement: { entityId: 'invented', coordinates: [0, 0, 0], value: 1 },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
  it('rejects mismatched run identity and duplicate frame/entity identity before rendering', async () => {
    const session = await create()
    const run = await complete(session.id, session.revisions[0].id)
    const frames = await api.getFrames(run.id)
    expect(() => assertRunIdentity({ ...run, configurationDigest: 'wrong' }, session)).toThrow()
    expect(() => assertFrameIdentity([frames[0], frames[0]], run)).toThrow()
    expect(() =>
      assertFrameIdentity(
        [{ ...frames[0], measurements: [frames[0].measurements[0], frames[0].measurements[0]] }],
        run,
      ),
    ).toThrow()
  })
  it('fails HTTP requests honestly and rejects malformed successful responses', async () => {
    const http = new HttpSimulationApi('https://example.invalid')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(http.listModels()).rejects.toMatchObject({ code: 'UNAVAILABLE' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { items: [{ id: 'fake' }], nextCursor: null } }), {
          status: 200,
        }),
      ),
    )
    await expect(http.listModels()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})

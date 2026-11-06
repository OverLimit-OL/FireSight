import { newSession } from '@/lib/session'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockResearchApi, CONVERSATIONS_KEY } from '@/services/mock/MockResearchApi'
import { HttpResearchApi } from '@/services/api/HttpResearchApi'
import { emptyContext, uncertaintySchema } from '@/types/research'
import { syntheticDataset, syntheticRows } from '@/services/mock/fixtures'
import { validateFile } from '@/lib/attachments'
import { readStored } from '@/lib/storage'
import { z } from 'zod'
const api = new MockResearchApi()
beforeEach(() => localStorage.clear())
describe('research provenance and persistence', () => {
  it('preserves study context without measurements in a saved session', async () => {
    const session = await api.saveSession(newSession({ ...emptyContext(), studyIds: ['bass'] }))
    expect((await api.getSession(session.id)).context.studyIds).toEqual(['bass'])
    expect(session.context.datasetIds).toEqual([])
    expect((await api.getStudy('bass')).datasetIds).toEqual([])
  })
  it('deduplicates retried creates and sends', async () => {
    const context = emptyContext()
    const conversation = await api.createConversation(context, 'Question', 'same-operation')
    expect((await api.createConversation(context, 'Question', 'same-operation')).id).toBe(
      conversation.id,
    )
    const input = {
      text: 'What does BASS study?',
      context,
      localAttachments: [],
      revision: 1,
      clientMessageId: 'message-operation',
    }
    const first = await api.sendMessage(conversation.id, input)
    const second = await api.sendMessage(conversation.id, input)
    expect(second.assistantMessage.id).toBe(first.assistantMessage.id)
    expect((await api.getConversation(conversation.id)).messages).toHaveLength(2)
    expect(first.assistantMessage.generation).toBe('scripted-demo')
  })
  it('rejects stale revisions without overwriting notes', async () => {
    const session = await api.saveSession(newSession(emptyContext()))
    await api.saveSession({ ...session, notes: 'Newer note' })
    await expect(api.saveSession({ ...session, notes: 'Stale note' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect((await api.getSession(session.id)).notes).toBe('Newer note')
  })
  it('cancels a response before committing messages', async () => {
    const c = await api.createConversation(emptyContext(), 'Cancelled')
    const controller = new AbortController()
    const request = api.sendMessage(
      c.id,
      {
        text: 'question',
        context: emptyContext(),
        localAttachments: [],
        revision: 1,
        clientMessageId: 'cancelled',
      },
      controller.signal,
    )
    controller.abort()
    await expect(request).rejects.toMatchObject({ code: 'ABORTED' })
    expect((await api.getConversation(c.id)).messages).toEqual([])
  })
  it('keeps synthetic values separate and preserves missing samples', () => {
    expect(syntheticDataset.studyId).toBeNull()
    expect(syntheticDataset.source).toBeNull()
    expect(syntheticRows.some((r) => r.values.a === null)).toBe(true)
    expect(syntheticDataset.variables.every((v) => v.unit === 'dimensionless')).toBe(true)
  })
  it('requires an actual method for a numerical confidence value', () => {
    expect(
      uncertaintySchema.safeParse({
        description: 'test',
        method: null,
        interval: null,
        confidence: { value: 0.9, scale: 'probability', method: '' },
      }).success,
    ).toBe(false)
  })
  it('reports corrupt storage instead of silently replacing research', () => {
    localStorage.setItem(CONVERSATIONS_KEY, '{broken')
    expect(() => readStored(CONVERSATIONS_KEY, z.array(z.string()), [])).toThrow(
      'could not be read',
    )
    expect(localStorage.getItem(CONVERSATIONS_KEY)).toBe('{broken')
  })
  it('preserves old saved view snapshots when a session changes', async () => {
    const s = newSession(emptyContext())
    const snapshot = {
      id: 'view-1',
      createdAt: new Date().toISOString(),
      studyIds: ['bass'],
      datasets: [],
      view: s.visualization,
      rowFilters: [],
      selectedRowIds: [],
      unitLabels: {},
      limitations: ['No measurements'],
    }
    const saved = await api.saveSession({ ...s, snapshots: [snapshot] })
    await api.saveSession({ ...saved, notes: 'Later research note' })
    expect((await api.getSession(saved.id)).snapshots[0]).toEqual(snapshot)
  })
})
describe('attachment validation', () => {
  it('accepts known types and empty MIME only for allowed extensions', () => {
    expect(validateFile({ name: 'run.csv', type: '', size: 10 })).toBeNull()
    expect(validateFile({ name: 'run.exe', type: '', size: 10 })).toBeTruthy()
    expect(validateFile({ name: 'run.pdf', type: 'text/html', size: 10 })).toBeTruthy()
    expect(
      validateFile({ name: 'run.json', type: 'application/json', size: 11 * 1024 * 1024 }),
    ).toContain('10 MiB')
  })
})
describe('HTTP mode never falls back to fixtures', () => {
  it('reports an outage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(new HttpResearchApi('http://invalid.test').listStudies()).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    })
    vi.unstubAllGlobals()
  })
  it('rejects a malformed successful envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { wrong: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    await expect(new HttpResearchApi('http://invalid.test').getStudy('bass')).rejects.toMatchObject(
      { code: 'INVALID_RESPONSE' },
    )
    vi.unstubAllGlobals()
  })
  it('does not parse a 204 deletion as JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(
      new HttpResearchApi('http://invalid.test').deleteConversation('id', 1),
    ).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })
})

describe('saved view integrity', () => {
  it('rejects modification of an existing immutable snapshot', async () => {
    const s = newSession(emptyContext())
    const snapshot = {
      id: 'immutable',
      createdAt: new Date().toISOString(),
      studyIds: ['bass'],
      datasets: [],
      view: s.visualization,
      rowFilters: [],
      selectedRowIds: [],
      unitLabels: {},
      limitations: ['No measurements'],
    }
    const saved = await api.saveSession({ ...s, snapshots: [snapshot] })
    await expect(
      api.saveSession({ ...saved, snapshots: [{ ...snapshot, studyIds: ['flex'] }] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect((await api.getSession(saved.id)).snapshots[0].studyIds).toEqual(['bass'])
  })
  it('rejects non-finite values instead of turning them into chart samples', async () => {
    const { rowSchema } = await import('@/types/research')
    expect(rowSchema.safeParse({ id: 'bad-row', values: { signal: Infinity } }).success).toBe(false)
    expect(rowSchema.safeParse({ id: 'missing-row', values: { signal: null } }).success).toBe(true)
  })
})

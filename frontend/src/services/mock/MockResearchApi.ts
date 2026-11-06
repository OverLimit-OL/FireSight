import { z } from 'zod'
import { readStored, writeStored } from '@/lib/storage'
import { APIError, conversationSchema, sessionSchema } from '@/types/research'
import type { Conversation, DemoScenario, LabSession, ResearchContext } from '@/types/research'
import type { ResearchApi, SendInput } from '@/services/api/ResearchApi'
import { demoResponse, studies, syntheticDataset, syntheticRows } from './fixtures'

export const CONVERSATIONS_KEY = 'firesight:demo:conversations:v1'
export const SESSIONS_KEY = 'firesight:demo:labs:v1'
const conversations = () => readStored(CONVERSATIONS_KEY, z.array(conversationSchema), [])
const sessions = () => readStored(SESSIONS_KEY, z.array(sessionSchema), [])
function found<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new APIError(
      'NOT_FOUND',
      `${name} was not found. It may have been removed from this device.`,
    )
  return value
}
export function checkRevision(actual: number, requested: number) {
  if (actual !== requested)
    throw new APIError(
      'CONFLICT',
      'This record changed in another tab. Reload the latest version before saving.',
    )
}
export class MockResearchApi implements ResearchApi {
  readonly mode = 'demo' as const
  async listStudies(scenario: DemoScenario = 'normal') {
    await new Promise((resolve) => setTimeout(resolve, 200))
    if (scenario === 'error')
      throw new APIError(
        'UNAVAILABLE',
        'Simulated collection error. Set Demo scenario to Normal in Settings, then retry.',
        true,
      )
    return scenario === 'empty' ? [] : studies
  }
  async getStudy(id: string) {
    return found(
      studies.find((s) => s.id === id),
      'Study',
    )
  }
  async listConversations() {
    return conversations().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  async getConversation(id: string) {
    return found(
      conversations().find((c) => c.id === id),
      'Conversation',
    )
  }
  async createConversation(context: ResearchContext, title: string, operationId?: string) {
    const all = conversations()
    const id = operationId ?? crypto.randomUUID()
    const existing = all.find((c) => c.id === id)
    if (existing) return existing
    const now = new Date().toISOString()
    const record: Conversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      context,
      messages: [],
      example: false,
    }
    writeStored(CONVERSATIONS_KEY, [...all, record])
    return record
  }
  async renameConversation(id: string, title: string, revision: number) {
    if (!title.trim() || title.trim().length > 120)
      throw new APIError('VALIDATION_ERROR', 'Use a title between 1 and 120 characters.')
    const all = conversations()
    const record = found(
      all.find((c) => c.id === id),
      'Conversation',
    )
    checkRevision(record.revision, revision)
    writeStored(
      CONVERSATIONS_KEY,
      all.map((c) =>
        c.id === id
          ? {
              ...c,
              title: title.trim(),
              revision: c.revision + 1,
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    )
  }
  async deleteConversation(id: string, revision: number) {
    const all = conversations()
    const record = all.find((c) => c.id === id)
    if (record) checkRevision(record.revision, revision)
    writeStored(
      CONVERSATIONS_KEY,
      all.filter((c) => c.id !== id),
    )
  }
  async sendMessage(
    id: string,
    input: SendInput,
    signal?: AbortSignal,
    scenario: DemoScenario = 'normal',
  ) {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer)
        reject(new APIError('ABORTED', 'Response cancelled. Your draft is preserved.'))
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort)
        resolve()
      }, 650)
      if (signal?.aborted) abort()
      else signal?.addEventListener('abort', abort, { once: true })
    })
    if (scenario === 'error')
      throw new APIError(
        'UNAVAILABLE',
        'Simulated response failure. Change Demo scenario to Normal in Settings and retry.',
        true,
      )
    const all = conversations()
    const record = found(
      all.find((c) => c.id === id),
      'Conversation',
    )
    const existing = record.messages.find((m) => m.id === input.clientMessageId)
    if (existing) {
      const reply = found(record.messages[record.messages.indexOf(existing) + 1], 'Response')
      return {
        userMessage: existing,
        assistantMessage: reply,
        conversationRevision: record.revision,
      }
    }
    checkRevision(record.revision, input.revision)
    if (!input.text.trim() || input.text.length > 12000)
      throw new APIError('VALIDATION_ERROR', 'Enter a question of at most 12,000 characters.')
    const userMessage = {
      id: input.clientMessageId,
      role: 'user' as const,
      generation: 'user' as const,
      createdAt: new Date().toISOString(),
      status: 'complete' as const,
      markdown: input.text,
      studyIds: input.context.studyIds,
      attachments: input.localAttachments.map((a) => ({
        ...a,
        status: 'reselect-required' as const,
      })),
      context: input.context,
      evidence: [],
    }
    const assistantMessage = demoResponse(input.context)
    if (input.context.simulationContext) {
      const state = input.context.simulationContext
      assistantMessage.markdown = `## Illustrative Studio context\n\nThis is a **scripted demonstration**, not AI analysis. The captured state identifies model **${state.modelId} v${state.modelVersion}**, run **${state.runId?.slice(0, 8) ?? 'not started'}**, and step **${state.timestamp?.value ?? 'not run'}**.\n\nSelected schematic component: **${state.selectedComponentId ?? 'none'}**.\n\nSelected sample: **${state.selectedMeasurement?.entityId ?? 'none'}**. Value: **${state.selectedMeasurement?.value ?? 'missing'}**, dimensionless. These are authored fixture values, not NASA measurements.\n\n### Interpretation limits\n\nNo combustion solver, validated model or uncertainty method is connected. The visualization cannot support fire-safety conclusions. Changing inputs requires a saved revision and a new run; this context remains tied to its original result.`
      assistantMessage.evidence = []
    }
    if (scenario === 'empty') {
      assistantMessage.markdown =
        '## No demonstration results\n\nThe empty-results scenario is selected. Your question and research context are preserved. Change the Demo scenario in Settings to return to the normal example.'
      assistantMessage.evidence = []
      assistantMessage.studyIds = []
    }
    const updated = {
      ...record,
      context: input.context,
      revision: record.revision + 1,
      updatedAt: new Date().toISOString(),
      messages: [...record.messages, userMessage, assistantMessage],
    }
    writeStored(
      CONVERSATIONS_KEY,
      all.map((c) => (c.id === id ? updated : c)),
    )
    return { userMessage, assistantMessage, conversationRevision: updated.revision }
  }
  async listSessions() {
    return sessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  async getSession(id: string) {
    return found(
      sessions().find((s) => s.id === id),
      'Lab workspace',
    )
  }
  async saveSession(session: LabSession) {
    if (!session.title.trim() || session.title.length > 120 || session.notes.length > 20000)
      throw new APIError(
        'VALIDATION_ERROR',
        'Use a title of 1–120 characters and notes up to 20,000 characters.',
      )
    const all = sessions()
    const existing = all.find((s) => s.id === session.id)
    if (existing) {
      checkRevision(existing.revision, session.revision)
      for (const snapshot of existing.snapshots) {
        if (
          JSON.stringify(session.snapshots.find((s) => s.id === snapshot.id)) !==
          JSON.stringify(snapshot)
        )
          throw new APIError(
            'VALIDATION_ERROR',
            'Saved view snapshots are immutable. Save a new view instead.',
          )
      }
    }
    const updated = {
      ...session,
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    }
    sessionSchema.parse(updated)
    writeStored(SESSIONS_KEY, [...all.filter((s) => s.id !== session.id), updated])
    return updated
  }
  async getDataset(id: string) {
    return found(id === syntheticDataset.id ? syntheticDataset : undefined, 'Dataset')
  }
  async getRows(id: string, revision: string) {
    if (revision !== syntheticDataset.revision)
      throw new APIError('NOT_FOUND', 'This dataset revision is unavailable.')
    return found(id === syntheticDataset.id ? syntheticRows : undefined, 'Dataset rows')
  }
}

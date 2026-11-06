import { APIError } from '@/types/research'
import type { SimulationFrame, SimulationRun, SimulationSession } from '@/types/simulation'
export function assertRunIdentity(run: SimulationRun, session: SimulationSession) {
  const revision = session.revisions.find((r) => r.id === run.revisionId)
  if (
    !revision ||
    run.sessionId !== session.id ||
    run.modelId !== session.modelId ||
    run.modelVersion !== session.modelVersion ||
    run.configurationDigest !== revision.configurationDigest
  )
    throw new APIError(
      'INVALID_RESPONSE',
      'Run provenance does not match the saved model and configuration revision. Results were not displayed.',
    )
}
export function assertFrameIdentity(frames: SimulationFrame[], run: SimulationRun) {
  const ids = new Set<string>()
  for (const frame of frames) {
    if (
      ids.has(frame.id) ||
      frame.runId !== run.id ||
      frame.revisionId !== run.revisionId ||
      frame.modelVersion !== run.modelVersion ||
      frame.field.domain[1] <= frame.field.domain[0]
    )
      throw new APIError(
        'INVALID_RESPONSE',
        'Frame identity or scalar domain is invalid. Rendering was stopped.',
      )
    ids.add(frame.id)
    const entities = new Set(frame.measurements.map((m) => m.entityId))
    if (entities.size !== frame.measurements.length)
      throw new APIError(
        'INVALID_RESPONSE',
        'Duplicate scientific entity IDs prevent reliable sample selection.',
      )
  }
}

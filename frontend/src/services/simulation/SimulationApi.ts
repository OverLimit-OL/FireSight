import type {
  AIAnalysisContext,
  ExperimentConfiguration,
  ResourceSimulationPreview,
  SimulationFrame,
  SimulationModel,
  SimulationRun,
  SimulationSession,
} from '@/types/simulation'
export interface SimulationApi {
  readonly mode: 'demo' | 'http'
  listModels(signal?: AbortSignal): Promise<SimulationModel[]>
  getModel(id: string, version: string, signal?: AbortSignal): Promise<SimulationModel>
  listSessions(signal?: AbortSignal): Promise<SimulationSession[]>
  getSession(id: string, signal?: AbortSignal): Promise<SimulationSession>
  createSession(input: {
    title: string
    modelId: string
    modelVersion: string
    configuration: ExperimentConfiguration
    studyIds: string[]
    parent?: { sessionId: string; revisionId: string }
  }): Promise<SimulationSession>
  saveSession(
    id: string,
    input: {
      version: number
      title: string
      notes: string
      configuration?: ExperimentConfiguration
    },
  ): Promise<SimulationSession>
  listRuns(sessionId: string, signal?: AbortSignal): Promise<SimulationRun[]>
  submitRun(
    sessionId: string,
    revisionId: string,
    operationId: string,
    outcome?: 'complete' | 'fail',
  ): Promise<SimulationRun>
  getRun(id: string, signal?: AbortSignal): Promise<SimulationRun>
  cancelRun(id: string): Promise<SimulationRun>
  getFrames(runId: string, signal?: AbortSignal): Promise<SimulationFrame[]>
  getResourcePreview(studyId: string, signal?: AbortSignal): Promise<ResourceSimulationPreview>
  captureContext(context: AIAnalysisContext): Promise<AIAnalysisContext>
  getContext(id: string, signal?: AbortSignal): Promise<AIAnalysisContext>
}

import { z } from 'zod'

export const provenanceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().nullable(),
  origin: z.enum(['recorded', 'computed', 'illustrative']),
  revision: z.string(),
})
export const warningSchema = z.object({ code: z.string(), message: z.string() })
export const validationSchema = z.object({
  status: z.enum(['unverified', 'validated', 'withdrawn']),
  evidence: z.array(provenanceSchema),
  scope: z.string().nullable(),
})
export const capabilitiesSchema = z.object({
  spatialRank: z.union([z.literal(2), z.literal(3)]),
  canRun: z.boolean(),
  canCancel: z.boolean(),
  views: z.array(z.enum(['slice', 'points', 'table'])),
})
export const configurationSchema = z.object({ sequenceId: z.enum(['reference', 'offset']) })
export const modelSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  origin: z.enum(['recorded', 'computed', 'illustrative']),
  capabilities: capabilitiesSchema,
  validation: validationSchema,
  inputs: z.array(
    z.object({
      id: z.literal('sequenceId'),
      label: z.string(),
      options: z.array(z.object({ value: z.enum(['reference', 'offset']), label: z.string() })),
    }),
  ),
  defaults: configurationSchema,
  provenance: z.array(provenanceSchema),
  limitations: z.array(z.string()),
})
export const revisionSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  createdAt: z.string(),
  modelId: z.string(),
  modelVersion: z.string(),
  configuration: configurationSchema,
  configurationDigest: z.string(),
})
export const jobStatusSchema = z.enum([
  'queued',
  'running',
  'cancelling',
  'completed',
  'failed',
  'cancelled',
])
export const runSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  revisionId: z.string(),
  modelId: z.string(),
  modelVersion: z.string(),
  configurationDigest: z.string(),
  status: jobStatusSchema,
  origin: z.enum(['recorded', 'computed', 'illustrative']),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  error: z.string().nullable(),
  warnings: z.array(warningSchema),
  provenance: z.array(provenanceSchema),
  fixtureId: z.string().nullable(),
  demoOutcome: z.enum(['complete', 'fail']).nullable(),
})
export const sessionSimulationSchema = z.object({
  schemaVersion: z.literal('simulation.v1'),
  id: z.string(),
  title: z.string().trim().min(1).max(120),
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
  modelId: z.string(),
  modelVersion: z.string(),
  studyIds: z.array(z.string()),
  parent: z.object({ sessionId: z.string(), revisionId: z.string() }).nullable(),
  revisions: z.array(revisionSchema).min(1),
  notes: z.string().max(20000),
})
export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  domain: z.tuple([z.number(), z.number()]),
  spatialRank: z.union([z.literal(2), z.literal(3)]),
  coordinateUnit: z.string(),
})
export const measurementSchema = z.object({
  entityId: z.string(),
  coordinates: z.tuple([z.number(), z.number(), z.number()]),
  value: z.number().finite().nullable(),
})
export const frameSchema = z.object({
  id: z.string(),
  runId: z.string(),
  revisionId: z.string(),
  modelVersion: z.string(),
  coordinate: z.object({ value: z.number(), unit: z.string() }),
  field: fieldSchema,
  measurements: z.array(measurementSchema),
})
export const analysisContextSchema = z.object({
  schemaVersion: z.literal('simulation.v1'),
  id: z.string(),
  capturedAt: z.string(),
  sessionId: z.string(),
  sessionTitle: z.string(),
  modelId: z.string(),
  modelVersion: z.string(),
  revisionId: z.string(),
  configurationDigest: z.string(),
  runId: z.string().nullable(),
  frameId: z.string().nullable(),
  timestamp: z.object({ value: z.number(), unit: z.string() }).nullable(),
  visualization: z.enum(['slice', 'points', 'table']),
  comparison: z
    .object({ runId: z.string(), revisionId: z.string(), frameId: z.string().nullable() })
    .nullable()
    .optional(),
  selectedComponentId: z.string().nullable().optional(),
  selectedMeasurement: measurementSchema.nullable(),
  origin: z.enum(['recorded', 'computed', 'illustrative']),
  studyIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  limitations: z.array(z.string()),
})
export const resourcePreviewSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('unavailable'), reason: z.string() }),
  z.object({
    status: z.literal('available'),
    sessionId: z.string(),
    runId: z.string(),
    frameId: z.string(),
    source: provenanceSchema,
  }),
])
export type SimulationModel = z.infer<typeof modelSchema>
export type ModelCapabilities = z.infer<typeof capabilitiesSchema>
export type ModelValidation = z.infer<typeof validationSchema>
export type ExperimentConfiguration = z.infer<typeof configurationSchema>
export type SimulationSession = z.infer<typeof sessionSimulationSchema>
export type SimulationRevision = z.infer<typeof revisionSchema>
export type SimulationRun = z.infer<typeof runSchema>
export type SimulationJobStatus = z.infer<typeof jobStatusSchema>
export type SimulationFrame = z.infer<typeof frameSchema>
export type VisualizationField = z.infer<typeof fieldSchema>
export type ScientificMeasurement = z.infer<typeof measurementSchema>
export type ProvenanceReference = z.infer<typeof provenanceSchema>
export type SimulationWarning = z.infer<typeof warningSchema>
export type AIAnalysisContext = z.infer<typeof analysisContextSchema>
export type ResourceSimulationPreview = z.infer<typeof resourcePreviewSchema>
export const terminalRun = (status: SimulationJobStatus) =>
  ['completed', 'failed', 'cancelled'].includes(status)
export function scientificMode(model: SimulationModel, run?: SimulationRun) {
  if ((run?.origin ?? model.origin) === 'recorded') return 'Recorded Experiment'
  // A catalog validation flag alone does not certify applicability of a particular run.
  return 'Illustrative / Not Scientifically Validated'
}

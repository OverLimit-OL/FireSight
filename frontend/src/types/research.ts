import { z } from 'zod'
import { analysisContextSchema } from './simulation'

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().nullable(),
  type: z.enum(['agency-page', 'paper', 'dataset', 'report', 'other']),
  publisher: z.string().nullable(),
  publishedAt: z.string().nullable(),
  retrievedAt: z.string().nullable(),
  locator: z.string().nullable(),
})
export type SourceReference = z.infer<typeof sourceSchema>
export const conditionSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.union([z.number(), z.string()]).nullable(),
  unit: z.string().nullable(),
  sourceReferenceId: z.string().nullable(),
  missingReason: z.string().nullable(),
})
export type ExperimentCondition = z.infer<typeof conditionSchema>
export const uncertaintySchema = z.object({
  description: z.string(),
  method: z.string().nullable(),
  interval: z.object({ low: z.number(), high: z.number(), unit: z.string().nullable() }).nullable(),
  confidence: z
    .object({
      value: z.number().min(0).max(1),
      scale: z.literal('probability'),
      method: z.string().trim().min(1),
    })
    .nullable(),
})
export const evidenceSchema = z.object({
  id: z.string(),
  classification: z.enum(['observation', 'interpretation', 'prediction']),
  studyId: z.string().nullable(),
  experimentName: z.string().nullable(),
  source: sourceSchema.nullable(),
  passage: z.string().nullable(),
  passageKind: z.enum(['quote', 'paraphrase']).nullable(),
  measurement: z
    .object({ value: z.number(), unit: z.string().nullable(), variableId: z.string().nullable() })
    .nullable(),
  studySectionId: z.string().nullable(),
  provenanceStatus: z.enum(['provided', 'partial', 'missing']),
  uncertainty: uncertaintySchema.nullable(),
  limitations: z.array(z.string()),
})
export type EvidenceReference = z.infer<typeof evidenceSchema>
export interface ScientificObservation {
  id: string
  kind: 'observation'
  text: string
  evidenceIds: string[]
  evidence: EvidenceReference[]
  origin: 'source' | 'synthetic'
}
export interface Interpretation {
  id: string
  kind: 'interpretation'
  text: string
  evidenceIds: string[]
  assumptions: string[]
  limitations: string[]
}
export interface Prediction {
  id: string
  kind: 'prediction'
  text: string
  evidenceIds: string[]
  model: { name: string; version: string; validationSource: SourceReference | null } | null
  inputSnapshotId: string | null
  uncertainty: z.infer<typeof uncertaintySchema> | null
  limitations: string[]
}
export const studySchema = z.object({
  id: z.string(),
  recordLevel: z.enum(['investigation', 'study', 'run']),
  investigation: z.string(),
  title: z.string(),
  objective: z.string().nullable(),
  description: z.string().nullable(),
  environment: z.string().nullable(),
  category: z.string(),
  conditions: z.array(conditionSchema),
  materials: z.array(z.string()),
  instruments: z.array(z.string()),
  measurementTypes: z.array(z.string()),
  datasetIds: z.array(z.string()),
  datasetsAvailability: z.enum(['available', 'unavailable', 'not-connected']),
  sources: z.array(sourceSchema),
  relatedStudyIds: z.array(z.string()),
  fieldLimitations: z.record(z.string(), z.string()),
})
export type ResearchStudy = z.infer<typeof studySchema>
export const variableSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['number', 'category', 'datetime']),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  role: z.enum(['independent', 'dependent', 'identifier']).nullable(),
  reportedPrecision: z.number().nullable(),
  description: z.string().nullable(),
})
export type DataVariable = z.infer<typeof variableSchema>
export const datasetSchema = z.object({
  id: z.string(),
  studyId: z.string().nullable(),
  title: z.string(),
  revision: z.string(),
  origin: z.enum(['source', 'synthetic']),
  availability: z.enum(['available', 'unavailable', 'not-connected']),
  variables: z.array(variableSchema),
  source: sourceSchema.nullable(),
  conditions: z.array(conditionSchema),
  limitations: z.array(z.string()),
})
export type Dataset = z.infer<typeof datasetSchema>
export const rowSchema = z.object({
  id: z.string(),
  values: z.record(z.string(), z.union([z.number(), z.string()]).nullable()),
})
export type DatasetRow = z.infer<typeof rowSchema>
export const visualizationSchema = z.object({
  type: z.enum(['line', 'scatter', 'table']),
  xVariableId: z.string().nullable(),
  yVariableIds: z.array(z.string()),
  axisDomain: z.object({
    x: z.tuple([z.number(), z.number()]).nullable(),
    y: z.tuple([z.number(), z.number()]).nullable(),
  }),
  transforms: z.array(z.never()),
})
export type VisualizationDefinition = z.infer<typeof visualizationSchema>
export const snapshotSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  studyIds: z.array(z.string()),
  datasets: z.array(
    z.object({ id: z.string(), revision: z.string(), origin: z.enum(['source', 'synthetic']) }),
  ),
  view: visualizationSchema,
  rowFilters: z.array(
    z.object({
      variableId: z.string(),
      operator: z.enum(['eq', 'gte', 'lte']),
      value: z.union([z.string(), z.number()]),
    }),
  ),
  selectedRowIds: z.array(z.string()),
  unitLabels: z.record(z.string(), z.string().nullable()),
  limitations: z.array(z.string()),
})
export type LabViewSnapshot = z.infer<typeof snapshotSchema>
export const contextSchema = z.object({
  studyIds: z.array(z.string()),
  datasetIds: z.array(z.string()),
  labSnapshot: snapshotSchema.nullable(),
  simulationContext: analysisContextSchema.nullable().optional(),
})
export type ResearchContext = z.infer<typeof contextSchema>
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mediaType: z.string().nullable(),
  byteSize: z.number(),
  status: z.enum(['staged-local', 'reselect-required', 'uploaded', 'failed']),
  serverFileId: z.string().nullable(),
  error: z.string().nullable(),
})
export type MessageAttachment = z.infer<typeof attachmentSchema>
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  createdAt: z.string(),
  status: z.enum(['pending', 'complete', 'failed', 'cancelled']),
  generation: z.enum(['user', 'scripted-demo', 'backend', 'system']),
  markdown: z.string(),
  studyIds: z.array(z.string()),
  attachments: z.array(attachmentSchema),
  context: contextSchema,
  evidence: z.array(evidenceSchema),
})
export type ChatMessage = z.infer<typeof messageSchema>
export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int(),
  context: contextSchema,
  messages: z.array(messageSchema),
  example: z.boolean(),
})
export type Conversation = z.infer<typeof conversationSchema>
export const sessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  revision: z.number().int(),
  context: contextSchema,
  visualization: visualizationSchema,
  selectedRowIds: z.array(z.string()),
  notes: z.string(),
  snapshots: z.array(snapshotSchema),
})
export type LabSession = z.infer<typeof sessionSchema>
export const emptyContext = (): ResearchContext => ({
  studyIds: [],
  datasetIds: [],
  labSnapshot: null,
})
export const emptyView = (): VisualizationDefinition => ({
  type: 'line',
  xVariableId: null,
  yVariableIds: [],
  axisDomain: { x: null, y: null },
  transforms: [],
})
export type DemoScenario = 'normal' | 'empty' | 'error'
export class APIError extends Error {
  code:
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'UNAVAILABLE'
    | 'INVALID_RESPONSE'
    | 'VALIDATION_ERROR'
    | 'STORAGE_ERROR'
    | 'ABORTED'
    | 'UNSUPPORTED_DATA'
  retryable: boolean
  constructor(code: APIError['code'], message: string, retryable = false) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.retryable = retryable
  }
}

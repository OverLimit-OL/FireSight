# Simulation API contract proposal

> Historical planning specification. The user explicitly lifted the timing gate on November 1, 2026. See the [implementation report](PHASE_2_IMPLEMENTATION_REPORT.md) and [actual client contract](PHASE_2_CLIENT_CONTRACT.md) for delivered scope and verification. Statements below about work not yet started describe the earlier planning stage.

**Planning only — no frontend simulation service or Flask endpoints implemented.** This extends [API_CONTRACT.md](../API_CONTRACT.md) without changing the existing ResearchApi transport. The Flask/scientific team must approve execution, validation, authorization and output semantics before HTTP integration.

## Conventions and ownership

Use the existing `/api/v1` base path, success/error envelopes, opaque IDs, ISO timestamps, explicit demo/http mode and validated JSON decoding. New records carry `schemaVersion: 'simulation.v1'`. IDs, timestamps and digests in examples are illustrative metadata, not scientific records. Dates, unknown units, uncertainty and absent source values remain nullable.

Backend owns models, applicability, execution, validation evidence, source recordings, scientific outputs, uncertainty and derived measurements. Frontend owns view preferences, draft editing, playback, accessible inspection and explicit confirmation. The demo adapter replays fixture bundles; it never computes combustion or evaluates scientific safety.

## Proposed domain types

These TypeScript declarations are documentation, not application source. `SourceReference` refers to the existing Phase 1 source contract. Runtime schemas must be added and tested after the timing gate.

```ts
type ID = string;
type ISODate = string;
type SchemaVersion = 'simulation.v1';
type InputValue = number | string | boolean;
type Origin = 'recorded' | 'computed' | 'illustrative';

interface UnitDefinition {
  symbol: string | null;
  quantity: string | null;
  dimension: string | null;
}
interface DatasetBinding {
  datasetId: ID;
  revision: string;
  role: string;
  origin: Origin;
}
interface ProvenanceReference {
  id: ID;
  origin: Origin;
  source: SourceReference | null;
  datasetId: ID | null;
  datasetRevision: string | null;
  locator: string | null;
  processing: Array<{ method: string; version: string; description: string }>;
  limitations: string[];
}
interface SimulationWarning {
  code: string;
  severity: 'information' | 'warning' | 'blocking';
  message: string;
  fieldIds: ID[];
  provenanceIds: ID[];
}

type ModelInputDefinition =
  | { id: ID; label: string; kind: 'scalar'; required: boolean;
      unit: UnitDefinition; min: number | null; max: number | null;
      step: number | null; defaultValue: number | null; explanation: string }
  | { id: ID; label: string; kind: 'enum'; required: boolean;
      options: Array<{ value: string; label: string }>;
      defaultValue: string | null; explanation: string }
  | { id: ID; label: string; kind: 'boolean'; required: boolean;
      defaultValue: boolean | null; explanation: string };

interface ModelCapabilities {
  execution: 'recording-only' | 'backend-model' | 'fixture-replay';
  inputsEditable: boolean;
  cancelComputation: boolean;
  spatialDimensions: Array<2 | 3>;
  representations: Array<'point-samples' | 'regular-grid' | 'surface-mesh' | 'volume-grid'>;
  viewModes: Array<'sample-map-2d' | 'slice-2d' | 'points-3d' | 'table'>;
  time: { kind: 'physical-time' | 'step'; unit: UnitDefinition };
  interpolation: 'none'; // v1 never creates intermediate scientific states
  supportsPartialResults: boolean;
  inputDefinitions: ModelInputDefinition[];
  constraints: Array<{ id: ID; description: string; inputIds: ID[] }>;
}
interface ModelValidation {
  id: ID;
  modelId: ID;
  modelVersion: string;
  verdict: 'unknown' | 'passed' | 'failed' | 'withdrawn';
  method: string | null;
  evaluatedScope: string | null;
  referenceIds: ID[];
  assessedAt: ISODate | null;
  limitations: string[];
}
interface SimulationModel {
  schemaVersion: SchemaVersion;
  id: ID;
  version: string;
  title: string;
  family: string;
  description: string;
  capabilities: ModelCapabilities;
  validation: ModelValidation;
  provenance: ProvenanceReference[];
  presets: Array<{ id: ID; title: string; inputs: Record<ID, InputValue>;
    datasetBindings: DatasetBinding[]; provenanceIds: ID[] }>;
  warnings: SimulationWarning[];
}

interface ExperimentConfiguration {
  schemaVersion: SchemaVersion;
  model: { id: ID; version: string };
  environmentId: ID | null;
  inputs: Record<ID, InputValue>;
  datasetBindings: DatasetBinding[];
  studyIds: ID[];
}
interface ApplicabilityReceipt {
  id: ID;
  configurationDigest: string;
  model: { id: ID; version: string };
  structuralStatus: 'valid' | 'invalid';
  applicability: 'not-assessed' | 'in-scope' | 'out-of-scope';
  validationReferenceId: ID | null;
  expiresAt: ISODate | null;
  fieldErrors: Record<ID, string[]>;
  warnings: SimulationWarning[];
}
interface SimulationRevision {
  schemaVersion: SchemaVersion;
  id: ID;
  sessionId: ID;
  ordinal: number;
  parentRevisionId: ID | null;
  configuration: ExperimentConfiguration;
  configurationDigest: string;
  applicabilityReceiptId: ID | null;
  createdAt: ISODate;
  authorAction: 'user' | 'confirmed-ai-proposal' | 'fork';
}

interface ViewSpecification {
  mode: 'sample-map-2d' | 'slice-2d' | 'points-3d' | 'table';
  fieldId: ID | null;
  sliceId: ID | null;
  colorDomain: [number, number] | null;
  colorMappingId: ID | null;
  camera: { position: [number, number, number]; target: [number, number, number] } | null;
}
interface SimulationSession {
  schemaVersion: SchemaVersion;
  id: ID;
  metadataRevision: number; // concurrency token, not a configuration ordinal
  title: string;
  tags: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
  currentConfigurationRevisionId: ID;
  configurationRevisionIds: ID[];
  runIds: ID[];
  sourceStudyIds: ID[];
  parent: { sessionId: ID; configurationRevisionId: ID; runId: ID | null } | null;
  savedView: ViewSpecification | null;
}
type SimulationJobStatus =
  | 'queued' | 'running' | 'cancelling' | 'completed' | 'failed' | 'cancelled';
interface SimulationRun {
  schemaVersion: SchemaVersion;
  id: ID;
  sessionId: ID;
  configurationRevisionId: ID;
  configurationDigest: string;
  model: { id: ID; version: string };
  origin: Origin;
  status: SimulationJobStatus;
  statusSequence: number; // monotonic update order for delayed responses
  progress: { completedWork: number; totalWork: number; unit: string } | null;
  submittedAt: ISODate;
  startedAt: ISODate | null;
  finishedAt: ISODate | null;
  outputState: 'pending' | 'ready' | 'expired' | 'unavailable';
  applicabilityReceiptId: ID | null;
  validationReferenceId: ID | null;
  provenance: ProvenanceReference[];
  warnings: SimulationWarning[];
  error: { code: string; message: string; retryable: boolean } | null;
}

interface FrameCoordinate {
  kind: 'physical-time' | 'step';
  value: number;
  unit: UnitDefinition;
}
interface VisualizationField {
  id: ID;
  label: string;
  unit: UnitDefinition;
  components: 1 | 2 | 3;
  spatialDimensions: 2 | 3;
  representation: 'point-samples' | 'regular-grid' | 'surface-mesh' | 'volume-grid';
  coordinateSystem: {
    id: ID;
    axisLabels: string[];
    axisUnits: UnitDefinition[];
    handedness: 'left' | 'right' | 'not-reported';
  };
  slices: Array<{ id: ID; label: string; sampleIds: ID[] }>;
  reportedDomain: [number, number] | null;
  provenanceIds: ID[];
  limitations: string[];
}
interface SimulationFrame {
  schemaVersion: SchemaVersion;
  id: ID;
  runId: ID;
  configurationRevisionId: ID;
  index: number;
  coordinate: FrameCoordinate;
  availableFieldIds: ID[];
  eventIds: ID[];
  complete: boolean;
}
interface FrameFieldData {
  schemaVersion: SchemaVersion;
  runId: ID;
  frameId: ID;
  fieldId: ID;
  representation: 'point-samples'; // the initial adapter's bounded encoding
  spatialDimensions: 2 | 3;
  samples: Array<{
    id: ID;
    entityId: ID | null;
    position: [number, number] | [number, number, number];
    value: number | [number, number] | [number, number, number] | null;
    provenanceIds: ID[];
  }>;
  contentDigest: string;
}
interface ScientificMeasurement {
  id: ID;
  runId: ID | null;
  recordingId: ID | null;
  frameId: ID | null; // no mapping is different from frame zero
  fieldId: ID | null;
  sampleId: ID | null;
  label: string;
  value: number | null;
  unit: UnitDefinition;
  origin: Origin;
  uncertainty: { description: string; method: string | null } | null;
  provenanceIds: ID[];
}
interface SimulationResults {
  runId: ID;
  configurationRevisionId: ID;
  measurements: ScientificMeasurement[];
  events: Array<{ id: ID; label: string; frameId: ID; provenanceIds: ID[] }>;
  series: Array<{
    id: ID;
    label: string;
    unit: UnitDefinition;
    origin: Origin;
    points: Array<{ measurementId: ID; frameId: ID | null;
      coordinate: FrameCoordinate; value: number | null }>;
    processing: Array<{ method: string; parameters: Record<string, string | number> }>;
  }>;
  provenance: ProvenanceReference[];
  limitations: string[];
}

interface AIAnalysisContext {
  schemaVersion: SchemaVersion;
  id: ID;
  capturedAt: ISODate;
  sessionId: ID | null;
  model: { id: ID; version: string } | null;
  configurationRevisionId: ID | null;
  configurationDigest: string | null;
  draftSnapshot: ExperimentConfiguration | null;
  runId: ID | null;
  frameId: ID | null;
  coordinate: FrameCoordinate | null;
  comparisonRunId: ID | null;
  comparisonFrameId: ID | null;
  selectedView: ViewSpecification | null;
  studyIds: ID[];
  datasets: DatasetBinding[];
  measurementIds: ID[];
  sampleIds: ID[];
  evidenceIds: ID[];
  provenance: ProvenanceReference[];
  resultOrigin: Origin | null;
  limitations: string[];
}
type AIActionProposal = {
  id: ID;
  contextSnapshotId: ID;
  baseConfigurationRevisionId: ID | null;
  rationale: string;
  evidenceIds: ID[];
  limitations: string[];
} & (
  | { kind: 'change-view'; proposedView: ViewSpecification }
  | { kind: 'create-configuration-draft'; inputChanges: Record<ID, InputValue> }
  | { kind: 'open-study'; studyId: ID }
  | { kind: 'compare-runs'; runIds: [ID, ID] }
);
```

## Mandatory invariants

- Configuration revisions and AI context snapshots are immutable. Runs pin model/version, configuration revision/digest and dataset revisions. Metadata renaming does not alter those identities. Forks create new session/revision IDs and parent links; parent output is not relabeled as child computation.
- A backend `passed` verdict is insufficient alone for the validated display mode. Verify supplied validation references, matching model version, a nonexpired matching applicability receipt with in-scope status, matching configuration digest and complete result provenance. These checks establish declared provenance consistency; they do not replace independent scientific validation. Missing evidence remains unverified.
- All numbers are finite. Scalar bounds, vector lengths, coordinate dimensionality, field/component identity, unique IDs and frame/run/revision membership must validate at the adapter boundary. Null samples remain null, not zero. A 2D payload cannot enable a 3D spatial renderer.
- Representation support must be negotiated. Receiving a volume/mesh payload when only point samples are supported produces UNSUPPORTED_REPRESENTATION, not fabricated surrogate geometry. Missing geometry/units/field frames remain explicit.
- Frame manifests are ordered by explicit index, not request arrival. Physical time has a reported unit; a fixture step is dimensionless. The first increment has no scientific interpolation. Exact measurement/frame mappings survive view switches and any future decimation.
- `outputState=ready` is independent from job completion. Completed runs may legitimately have no visualizable frames. Partial frames cannot be presented as complete results. An expired output preserves run metadata and source context.
- Displayed confidence percentages, validation scores, residuals and derived differences require separately documented supplied methods/results. No score is inferred from run completion, citation count or visual agreement.
- AI proposal types are a closed allowlist. Do not evaluate arbitrary scripts, formulas, URLs or tool-call names as commands. Preview, confirm and recheck the base before applying. Applying a configuration proposal does not run it.

## Proposed application service boundary

The future controller uses a separate Promise-based interface; components never call solver endpoints directly. Mutations receive an operation ID and optional AbortSignal through RequestOptions. Aborting transport does not imply job cancellation. The complete endpoint table below remains authoritative for additional revision/index operations.

```ts
interface RequestOptions { operationId: ID; signal?: AbortSignal }
interface Page<T> { items: T[]; nextCursor: string | null }
interface RunReceipt {
  runId: ID;
  status: SimulationJobStatus;
  origin: Origin;
  statusUrl: string;
}
interface FrameManifestPage extends Page<SimulationFrame> {
  runId: ID;
  configurationRevisionId: ID;
  manifestRevision: string;
  fields: VisualizationField[];
}
interface AnnotationMapping {
  observationId: ID;
  frameId: ID;
  fieldId: ID | null;
  entityId: ID | null;
  sampleId: ID | null;
  evidenceIds: ID[];
}
type ResourceSimulationPreview = {
  studyId: ID;
  provenance: ProvenanceReference[];
  limitations: string[];
} & (
  | { availability: 'unavailable'; reasons: SimulationWarning[] }
  | { availability: 'recorded'; recording: DatasetBinding; runId: ID;
      manifestRevision: string; mappings: AnnotationMapping[] }
  | { availability: 'model-backed'; model: { id: ID; version: string };
      configurationRevisionId: ID | null; runId: ID | null;
      mappings: AnnotationMapping[] }
);
interface SimulationApi {
  readonly mode: 'demo' | 'http';
  listModels(cursor?: string): Promise<Page<SimulationModel>>;
  getModel(id: ID, version: string): Promise<SimulationModel>;
  validateConfiguration(configuration: ExperimentConfiguration): Promise<ApplicabilityReceipt>;
  listSessions(cursor?: string): Promise<Page<SimulationSession>>;
  createSession(input: {title: string; configuration: ExperimentConfiguration},
    options: RequestOptions): Promise<{session: SimulationSession; initialRevision: SimulationRevision}>;
  getSession(id: ID): Promise<SimulationSession>;
  saveSessionMetadata(id: ID, patch: {metadataRevision: number; title?: string;
    tags?: string[]; savedView?: ViewSpecification}, options: RequestOptions): Promise<SimulationSession>;
  getRevision(sessionId: ID, revisionId: ID): Promise<SimulationRevision>;
  saveRevision(sessionId: ID, input: {baseRevisionId: ID;
    configuration: ExperimentConfiguration; applicabilityReceiptId?: ID},
    options: RequestOptions): Promise<SimulationRevision>;
  forkSession(sessionId: ID, input: {title: string; sourceRevisionId: ID; sourceRunId?: ID},
    options: RequestOptions): Promise<{session: SimulationSession; initialRevision: SimulationRevision}>;
  submitRun(sessionId: ID, input: {configurationRevisionId: ID; applicabilityReceiptId: ID},
    options: RequestOptions): Promise<RunReceipt>;
  getRun(runId: ID, signal?: AbortSignal): Promise<SimulationRun>;
  requestCancellation(runId: ID, options: RequestOptions): Promise<RunReceipt>;
  getFrames(runId: ID, cursor?: string, manifestRevision?: string): Promise<FrameManifestPage>;
  getFieldData(runId: ID, frameId: ID, fieldId: ID, manifestRevision: string,
    signal?: AbortSignal): Promise<FrameFieldData>;
  getResults(runId: ID): Promise<SimulationResults>;
  getResourcePreview(studyId: ID): Promise<ResourceSimulationPreview>;
  captureContext(input: Omit<AIAnalysisContext, 'id' | 'capturedAt'>,
    options: RequestOptions): Promise<AIAnalysisContext>;
  getContext(contextId: ID): Promise<AIAnalysisContext>;
}
```

Model definitions and receipts describe applicability constraints; clients do not execute arbitrary server-provided predicates. The first comparison increment can show independent pinned runs without a numeric overlay. Exact cross-run alignment or derived differences require an agreed mapping/result contract; absent that, alignment remains unavailable.

## Proposed endpoints

Paths below are relative to `/api/v1`. List success payloads are `{data:{items,nextCursor}}`. A failure in HTTP mode never returns local fixtures.

| Method/path | Request | Response and semantics |
| --- | --- | --- |
| GET `/simulation-models` | optional family/capability filter, cursor, limit | 200 catalog model/version entries; empty is honest |
| GET `/simulation-models/:id` | required selected `version` query | 200 exact SimulationModel; unavailable version 404 |
| POST `/simulation-configurations/validate` | ExperimentConfiguration | 200 ApplicabilityReceipt with field feedback; structural validity is separate from scientific applicability |
| GET `/simulation-sessions` | q, mode, tags, cursor, limit | 200 session summaries for the overview |
| POST `/simulation-sessions` | `{title, configuration, sourceContextSnapshotId?}` | 201 `{session, initialRevision}`; does not start a run |
| GET `/simulation-sessions/:id` | none | 200 SimulationSession |
| PATCH `/simulation-sessions/:id` | `{metadataRevision,title?,tags?,savedView?}` | 200 updated session metadata; configuration edits forbidden here |
| GET `/simulation-sessions/:id/revisions` | cursor, limit | 200 immutable revision index |
| GET `/simulation-sessions/:id/revisions/:revisionId` | none | 200 exact SimulationRevision |
| POST `/simulation-sessions/:id/revisions` | `{baseRevisionId,configuration,applicabilityReceiptId?}` | 201 new revision; 409 stale base, 422 invalid input |
| POST `/simulation-sessions/:id/forks` | `{title,sourceRevisionId,sourceRunId?}` | 201 new session/revision with parent reference; no new computed result |
| POST `/simulation-sessions/:id/runs` | `{configurationRevisionId,applicabilityReceiptId}` | 202 submission receipt; idempotent create; no mutable input body |
| GET `/simulation-runs/:runId` | none | 200 SimulationRun; definitive job/statusSequence |
| POST `/simulation-runs/:runId/cancel` | idempotency key, optional reason | 202 accepted request or current terminal record; computation may finish first |
| GET `/simulation-runs/:runId/frames` | cursor, limit, manifestRevision? | 200 frame manifest page with immutable manifestRevision, coordinate definition and VisualizationField descriptors |
| GET `/simulation-runs/:runId/frames/:frameId/fields/:fieldId` | representation, expected manifestRevision | 200 FrameFieldData; explicit size/encoding limits |
| GET `/simulation-runs/:runId/results` | cursor, limit where needed | 200 SimulationResults or a versioned paginated result manifest |
| GET `/resources/:studyId/simulation` | optional exact source/model version | 200 resource preview capabilities described below |
| POST `/simulation-contexts` | captured AIAnalysisContext without server ID/time | 201 immutable context snapshot reference |
| GET `/simulation-contexts/:contextId` | none | 200 exact snapshot for Copilot/chat refresh and sharing within authorized scope |

Additional revision, fork, field-payload and context-snapshot endpoints are intentional refinements of the user's sketch: they preserve immutable configurations, avoid giant frame-list responses and make cross-page context reloadable. All require backend agreement. Authentication/authorization and artifact retention are not invented by the frontend; approve those before hosted HTTP use.

### Resource preview response

Use a discriminated union:

- `availability: 'unavailable'`: reason codes/messages, source references, nullable model/recording candidates and supported alternatives. No preview frame or invented visual payload.
- `availability: 'recorded'`: exact dataset/recording revision, existing read-only run/manifest reference, fields, source-backed annotation mappings and limitations.
- `availability: 'model-backed'`: exact model/version, applicability requirements, supported configuration source, optional existing run reference, provenance and limitations. A configuration without a run has no result preview.

Mappings explicitly associate observation ID, field/sample/entity ID, frame ID and evidence IDs. Missing mapping means no automatic highlight. Missing study is 404; missing reconstruction data is a successful unavailable capability response, distinguishable from an endpoint outage.

### Submission and error examples

This request exercises an illustrative preset; it does not describe a physical experiment:

```json
{
  "configurationRevisionId": "example-revision-b",
  "applicabilityReceiptId": "example-structural-receipt"
}
```

```json
{
  "data": {
    "runId": "example-illustrative-run",
    "status": "queued",
    "origin": "illustrative",
    "statusUrl": "/api/v1/simulation-runs/example-illustrative-run"
  },
  "meta": { "mode": "demo", "requestId": "example-request" }
}
```

The 202 submission receipt intentionally differs from a complete SimulationRun; GET supplies the full job record. For real HTTP requests, meta.mode is http. Source classification remains illustrative for a server-hosted fixture replay; deployment mode does not upgrade scientific validity.

```json
{
  "error": {
    "code": "APPLICABILITY_OUT_OF_SCOPE",
    "message": "This configuration is outside the supplied model applicability scope.",
    "fieldErrors": { "example-input-id": ["Review the model-supported conditions."] },
    "requestId": "example-request",
    "retryable": false
  }
}
```

No scientific range or numerical safety threshold is invented in these examples. For a demo fixture replay, structural validation may succeed while applicability remains not-assessed and model validation remains unknown. That is not a valid scientific-model run.

## Lifecycle and error handling

Create/save/fork/run/cancel/context mutations use idempotency keys with backend-agreed retention and body fingerprints. An identical retry returns the original operation result; changed content with the same key yields 409. Revisions use a baseRevisionId precondition; session metadata uses metadataRevision. Digests are server-issued over a versioned canonical configuration serialization; agree the canonicalization before client comparisons. No invented client hash is trusted as scientific proof.

Poll queued/running/cancelling jobs, respecting Retry-After and statusSequence. Do not regress a terminal status on a late response. On timeout preserve operation IDs and show uncertain connection state; reload authoritative status before resubmission. Stop observers at terminal state/unmount. SSE remains an optional later transport behind the service interface, not an assumed Flask capability.

Expected statuses/codes include: 404 MODEL_VERSION_NOT_FOUND / FRAME_NOT_FOUND; 409 STALE_REVISION / IDEMPOTENCY_CONFLICT / RUN_ALREADY_TERMINAL; 410 OUTPUT_EXPIRED; 413 OUTPUT_TOO_LARGE; 415 UNSUPPORTED_REPRESENTATION; 422 INVALID_CONFIGURATION / APPLICABILITY_OUT_OF_SCOPE / FRAME_IDENTITY_MISMATCH; 429 RATE_LIMITED with Retry-After; 503 MODEL_UNAVAILABLE / COMPUTATION_SERVICE_UNAVAILABLE. Unknown codes retain a safe server message; malformed success envelopes become INVALID_RESPONSE. None triggers demo fallback.

Cancellation is capability-gated. The UI says Cancellation requested after 202 until the server confirms cancelled or a competing terminal result. A recorded-only source cannot accept a new numerical run; return a clear unsupported-operation response. Failed/cancelled/expired jobs keep their configuration and provenance.

Frame payloads must match run, configuration, manifest and field identities before being cached or drawn. Keep incomplete, unsupported-size, corrupted and missing-output states distinct from empty valid output. Avoid dumping engine stack traces or input files into errors.

## Phase 1 context extension

Propose an optional nullable `simulationContextId` in ResearchContext. Old persisted records decode to null. During implementation update Zod, both adapters, drafts and message serialization together; verify the field is not stripped. Existing studyIds/datasetIds/labSnapshot fields remain valid. A backend that cannot retain the new field must reject the unsupported context, not silently discard it.

Lab/Resource → Copilot captures the structured snapshot above. Open in Research Chat persists it via `/simulation-contexts`, then navigates to `/?simulationContext=<id>`. Chat loads and displays the exact snapshot and origin before send. Large scientific arrays are not placed in query strings or message payloads; references pin retrievable output revisions.

View changes after capture require an explicit draft-context update. Submitted messages and accepted proposal audit records retain their original context IDs. If referenced output expires, show the captured identifiers/limits and an unavailable-output state rather than replacing it with a new run.

## Backend handoff decisions still required

Confirm scientific model ownership and validation criteria; execution availability and quotas; applicability receipts/digest rules; asynchronous polling/status ordering; artifact/manifest revision semantics; supported encodings and size limits; unit/coordinate dictionaries; access control and retention; context/proposal support in chat; and concurrency/idempotency guarantees. Frontend readiness cannot close those scientific/backend gates.

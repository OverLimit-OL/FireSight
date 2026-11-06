# FireSight — proposed frontend/Flask contract

Simulation Studio now has an implemented bounded adapter: see [Phase 2 client contract](docs/PHASE_2_CLIENT_CONTRACT.md) for actual endpoints, payloads and differences from the broader proposal. No Flask routes are implemented here.

Version proposal v1 · October 31, 2026. A typed frontend interface, local mock adapter and validated HTTP adapter are now implemented. Flask endpoints remain proposed and unconfirmed. The original comprehensive type specification below is planning documentation; the implemented v1 transport differences are listed next.


## Implemented client v1

Canonical runtime schemas are in `frontend/src/types/research.ts`; operation signatures are in `frontend/src/services/api/ResearchApi.ts`. Both adapters are used through that interface. This section takes precedence over older planning examples where shapes differ.

- ChatMessage currently uses `markdown: string`, `studyIds: string[]`, `context`, `attachments`, `evidence`, role/status/generation/createdAt instead of the proposed heterogeneous `blocks` union. The frontend supports prose, code, math, source records and Lab snapshot summaries through that representation.
- ResearchStudy adds a required `category: string` for the source-backed research objective grouping. Unconnected finding/file fields are currently presented as explicit unavailable states; numerical results are not inferred from descriptions.
- HTTP list endpoints use `{data:{items,nextCursor}}`; the adapter loads bounded pages up to 10,000 records and rejects repeated cursors. Conversation summaries may omit messages; the decoder supplies an empty array for the index only.
- API base configuration is an origin without `/api/v1`; the adapter adds that prefix. Overview status is presented truthfully from demonstration configuration; `/overview` is not currently requested.
- Demo-only localAttachments metadata is a domain command field. HttpResearchApi rejects staged local files; no `/files` upload is implemented or implied. Only confirmed serverFileId values can be serialized as fileIds.
- Demo persistence validates versioned storage and optimistic revisions. Demo snapshots are treated as immutable once saved. Real backend idempotency, revision handling and transactions still require server confirmation.
- HTTP error decoding currently preserves a safe message and maps common status categories; field-specific backend validation rendering and a streaming/job protocol remain integration work.
- No API endpoint, authentication or backend business logic is provided by this repository. Mock success is not proof of Flask compatibility.

## Transport conventions

Base path `/api/v1`. JSON uses camelCase, UTF-8, opaque string IDs and ISO 8601 UTC timestamps. `null` means unknown/not supplied for a known field; an empty array means no entries supplied, not proof that an experiment had none. Optional fields are omitted only where documented. Never turn missing scientific values into zero or substitute synthetic data.

Success envelope: `{ "data": T, "meta": { "mode": "http", "requestId": "opaque-id" } }`. MockResearchApi returns the same domain data through its interface; its transport metadata identifies `demo`. Paginated lists use `data: {items, nextCursor}`; cursor is opaque and nullable. Page limit defaults to 25 and is bounded at 100. HTTP error bodies use the envelope below. Timestamps on local demo activity describe local operations, never NASA publication dates.

Mutating create/send requests carry an `Idempotency-Key` UUID, retained on retry. Proposed retention: 24 hours; the backend team must confirm support before the client relies on automatic retries. Repeating a key and identical body returns the original result; changed body yields 409. PATCH uses an integer `revision` precondition, conflicts return 409 with currentRevision. No automatic mutation retry when guarantees are unavailable.

No authentication is specified in this phase. Do not infer that future hosted data may be publicly writable. Authentication, authorization and credentials are a separate backend deployment decision before HTTP production use. No token goes into Vite public configuration.

## Scientific and interaction models

Identifiers below are opaque strings; real IDs need not match the recognizable investigation abbreviation. Separate investigation metadata from individual experimental runs. Do not imply a high-level investigation card is a fully described experimental study.

```ts
type ID = string;
type ISODate = string;
type DataOrigin = 'source' | 'synthetic';
type Availability = 'available' | 'unavailable' | 'not-connected';

interface SourceReference {
  id: ID;
  title: string;
  url: string | null;
  type: 'agency-page' | 'paper' | 'dataset' | 'report' | 'other';
  publisher: string | null;
  publishedAt: ISODate | null;
  retrievedAt: ISODate | null;
  locator: string | null; // page, section, figure or row, if known
}

interface ExperimentCondition {
  id: ID;
  name: string;
  value: number | string | null;
  unit: string | null;
  sourceReferenceId: ID | null;
  missingReason: string | null;
}

interface ResearchStudy {
  id: ID;
  recordLevel: 'investigation' | 'study' | 'run';
  investigation: string;
  title: string;
  objective: string | null;
  description: string | null;
  environment: string | null;
  conditions: ExperimentCondition[];
  materials: string[];
  instruments: string[];
  measurementTypes: string[];
  findings: ScientificObservation[];
  datasetIds: ID[];
  datasetsAvailability: Availability;
  files: ResourceFile[];
  sources: SourceReference[];
  relatedStudyIds: ID[];
  fieldLimitations: Record<string, string>;
}

interface ResourceFile {
  id: ID;
  name: string;
  mediaType: string | null;
  byteSize: number | null;
  url: string | null;
  availability: Availability;
  sourceReferenceId: ID | null;
}

interface DataVariable {
  id: ID;
  label: string;
  kind: 'number' | 'category' | 'datetime';
  quantity: string | null; // e.g. documented quantity, not a guessed label
  unit: string | null;
  role: 'independent' | 'dependent' | 'identifier' | null;
  reportedPrecision: number | null;
  description: string | null;
}

interface Dataset {
  id: ID;
  studyId: ID | null; // null for independent synthetic example
  title: string;
  revision: string;
  origin: DataOrigin;
  availability: Availability;
  variables: DataVariable[];
  source: SourceReference | null;
  conditions: ExperimentCondition[];
  limitations: string[];
}

interface DatasetRow {
  id: ID;
  values: Record<ID, number | string | null>; // keys are variable IDs
}

interface Uncertainty {
  description: string;
  method: string | null;
  interval: { low: number; high: number; unit: string | null } | null;
  confidence: { value: number; scale: 'probability'; method: string } | null;
}

interface EvidenceReference {
  id: ID;
  classification: 'observation' | 'interpretation' | 'prediction';
  studyId: ID | null;
  experimentName: string | null;
  source: SourceReference | null;
  passage: string | null;
  passageKind: 'quote' | 'paraphrase' | null;
  measurement: { value: number; unit: string | null; variableId: ID | null } | null;
  studySectionId: string | null;
  provenanceStatus: 'provided' | 'partial' | 'missing';
  uncertainty: Uncertainty | null;
  limitations: string[];
}

interface ScientificObservation {
  id: ID;
  kind: 'observation';
  text: string;
  evidenceIds: ID[];
  evidence: EvidenceReference[];
  origin: DataOrigin;
}

interface Interpretation {
  id: ID;
  kind: 'interpretation';
  text: string;
  evidenceIds: ID[];
  assumptions: string[];
  limitations: string[];
}

interface Prediction {
  id: ID;
  kind: 'prediction';
  text: string;
  evidenceIds: ID[];
  model: { name: string; version: string; validationSource: SourceReference | null } | null;
  inputSnapshotId: ID | null;
  uncertainty: Uncertainty | null;
  limitations: string[];
}

interface MessageAttachment {
  id: ID;
  name: string;
  mediaType: string | null;
  byteSize: number;
  status: 'staged-local' | 'reselect-required' | 'uploaded' | 'failed';
  serverFileId: ID | null;
  error: string | null;
}

interface VisualizationDefinition {
  type: 'line' | 'scatter' | 'table';
  xVariableId: ID | null;
  yVariableIds: ID[];
  axisDomain: { x: [number, number] | null; y: [number, number] | null };
  transforms: []; // v1: no scientific transforms supported
}

interface LabViewSnapshot {
  id: ID;
  createdAt: ISODate;
  studyIds: ID[];
  datasets: Array<{ id: ID; revision: string; origin: DataOrigin }>;
  view: VisualizationDefinition;
  rowFilters: Array<{ variableId: ID; operator: 'eq' | 'gte' | 'lte'; value: string | number }>;
  selectedRowIds: ID[];
  unitLabels: Record<ID, string | null>;
  limitations: string[];
}

interface ResearchContext {
  studyIds: ID[];
  datasetIds: ID[];
  labSnapshot: LabViewSnapshot | null;
}

type MessageBlock =
  | { kind: 'markdown'; markdown: string }
  | { kind: 'study'; studyId: ID }
  | { kind: 'claim'; claim: ScientificObservation | Interpretation | Prediction }
  | { kind: 'data-summary'; datasetId: ID; text: string; origin: DataOrigin }
  | { kind: 'chart-reference'; snapshot: LabViewSnapshot }
  | { kind: 'status'; state: 'pending' | 'empty' | 'error'; text: string };

interface ChatMessage {
  id: ID;
  role: 'user' | 'assistant' | 'system';
  createdAt: ISODate;
  status: 'pending' | 'complete' | 'failed' | 'cancelled';
  generation: 'user' | 'scripted-demo' | 'backend' | 'system';
  blocks: MessageBlock[];
  attachments: MessageAttachment[];
  context: ResearchContext;
  evidence: EvidenceReference[];
  error: APIError | null;
}

interface Conversation {
  id: ID;
  title: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  revision: number;
  context: ResearchContext;
  messages: ChatMessage[];
  example: boolean;
}

interface LabSession {
  id: ID;
  title: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  revision: number;
  context: ResearchContext;
  visualization: VisualizationDefinition;
  selectedRowIds: ID[];
  notes: string;
  snapshots: LabViewSnapshot[]; // immutable once saved
}

interface APIError {
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED'
      | 'UNAVAILABLE' | 'UNSUPPORTED_DATA' | 'INVALID_RESPONSE'
      | 'NETWORK_ERROR' | 'ABORTED' | 'STORAGE_ERROR';
  message: string;
  fieldErrors: Record<string, string[]> | null;
  requestId: string | null;
  retryable: boolean;
  currentRevision?: number;
}
```

Additional response DTOs: `Overview` contains `collectionStatus` (`example-index`, `connected` or `unavailable`), nullable `collectionDescription`, `investigationIds`, and recent user activity with route targets and local/remote origin. No collection totals are required. `ConversationSummary` is Conversation without messages; its context is retained. List/detail resources use the same study model initially because the demonstration collection is small; optimize only after payload measurement.

### Model invariants

- SourceReference.url is nullable and must be a safe http(s) URL before rendering. Missing URL yields readable source metadata without a fake link.
- Observation records require supporting evidence for display as sourced findings; source-free blocks are visibly unsupported. The UI does not infer that supplied citations validate a conclusion.
- A confidence value is rendered only when its method exists and is nonempty, value is finite and in [0,1], and the backend actually supplied it. It is labeled with that method, not as a universal AI confidence score. Otherwise show uncertainty not reported.
- Source-free Prediction retains a limitations state and cannot be labeled validated. The planned demo supplies no predictive scientific output.
- Synthetic Dataset has studyId null, an explicit synthetic limitation, and no NASA source reference. Study context can coexist in a session without attributing those rows to the study.
- Finite JSON numbers only; missing samples are null. Unknown variable IDs, invalid domains, mismatched units and contradictory origin/source metadata are rejected with recoverable validation errors.
- Lab snapshots are immutable and include dataset revision. If that revision is unavailable, show stale/unavailable source state rather than plot a newer dataset as the original.

## Endpoint table

All mutation request bodies reject unknown write-only fields. Server-generated IDs, timestamps, revisions and scientific provenance are not client-editable through conversation/session endpoints.

| Method and path | Request | Success | Important failures |
| --- | --- | --- | --- |
| GET `/overview` | none | 200 Overview | 503 |
| GET `/resources` | `q`, repeated `investigation`, `availability`, `sort=title-asc|title-desc`, `cursor`, `limit` | 200 Page<ResearchStudy> | 422 invalid filters |
| GET `/resources/:id` | none | 200 ResearchStudy | 404 |
| GET `/datasets/:id` | none | 200 Dataset | 404, 503 |
| GET `/datasets/:id/rows` | `revision`, `cursor`, `limit` | 200 Page<DatasetRow> with datasetRevision | 404 missing revision, 409 revision mismatch, 422 |
| GET `/conversations` | `q`, `cursor`, `limit` | 200 Page<ConversationSummary> newest updated first | 422 |
| POST `/conversations` | `{title, context}` | 201 Conversation, messages initially empty | 422, 409 idempotency conflict |
| GET `/conversations/:id` | none | 200 Conversation | 404 |
| PATCH `/conversations/:id` | `{title, revision}` | 200 Conversation | 404, 409, 422 |
| DELETE `/conversations/:id` | `If-Match: "revision"` | 204, no envelope | 409 stale; missing record is also 204 |
| POST `/conversations/:id/messages` | SendMessageRequest below | 200 SendMessageResult | 404, 409, 413, 422, 429, 503 |
| POST `/files` | multipart `file` | 201 `{id,name,mediaType,byteSize,status:"uploaded"}` | 413, 415, 422, 503 |
| GET `/lab/sessions` | `cursor`, `limit` | 200 Page<LabSession> | 422 |
| POST `/lab/sessions` | `{title, context, visualization, notes}` | 201 LabSession | 422, 409 |
| GET `/lab/sessions/:id` | none | 200 LabSession | 404 |
| PATCH `/lab/sessions/:id` | `{revision, title?, context?, visualization?, selectedRowIds?, notes?, appendSnapshot?}` | 200 LabSession | 404, 409, 422 |

Changes from the user's initial endpoint sketch: add dataset metadata/row retrieval because Lab needs data independent of study descriptions; add session listing for resume; include revision and idempotency semantics; use an atomic synchronous message result for v1. These are proposed integration decisions, not implemented backend routes.

### Message request and response

```ts
interface SendMessageRequest {
  text: string;
  context: ResearchContext;
  fileIds: ID[]; // confirmed uploaded server files only
  clientMessageId: ID;
  revision: number;
}
interface SendMessageResult {
  conversationRevision: number;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}
```

v1 proposes a single complete response, with no streaming contract. The operation should commit user and assistant messages atomically or report an error; backend must confirm transaction semantics. If future inference requires a queue/stream, agree a job/status/cancellation protocol before exposing streaming UI. The frontend must never invent tool execution steps while waiting.

Local staged file metadata is an adapter-only extension (`localAttachments: MessageAttachment[]`), never serialized into `fileIds`. MockResearchApi does not implement a successful upload: it accepts local attachments for display and labels them unprocessed. HTTP mode uploads only after an explicit user submit action, with clear upload state and then confirmed IDs; that flow is future work, not enabled by selecting files.

### Example contextual conversation creation

```json
{
  "title": "Study review",
  "context": {
    "studyIds": ["example-study-id"],
    "datasetIds": [],
    "labSnapshot": null
  }
}
```

The ID is illustrative and must be resolved by the selected adapter. It is not an asserted NASA identifier.

### Error envelope

```json
{
  "error": {
    "code": "UNSUPPORTED_DATA",
    "message": "No measurements are connected for this study.",
    "fieldErrors": null,
    "requestId": "example-request-id",
    "retryable": false
  }
}
```

400 malformed JSON; 404 missing resource; 409 concurrent revision/idempotency conflict; 413 size exceeded; 415 unsupported file media; 422 semantic validation; 429 rate limiting with Retry-After; 503 temporary unavailability. Adapter maps network/abort/invalid-JSON failures to typed client errors. A 204 response must not be parsed as JSON. HTML from a misconfigured SPA rewrite is INVALID_RESPONSE, never an empty successful result. Do not put stack traces, secrets or uploaded content into error text.

## Validation, limits and consistency

Proposed defaults: titles 1–120 characters, message 1–12,000 characters after trim for emptiness, notes up to 20,000 characters, max 3 studies in comparison, files up to 5 per message and 10 MiB each. Backend must enforce its own limits and can return stricter ones; frontend must display field errors. Whitespace-only text is rejected; attachment-only messages are unsupported in v1 with clear guidance.

Resource query repeated values use OR within a dimension and AND across dimensions. Search q is trimmed, case-insensitive text; title sorting has an ID tie-breaker. Pagination is stable for a fixed query/revision. Unsupported filters yield 422 rather than silently returning everything.

Rows return raw reported values. Pagination, filtering and revision must describe the same dataset. The frontend must not plot only the first page as if it were the entire experiment. Initial Lab loads all bounded demonstration rows; for future large datasets, agree an explicit server decimation/aggregation contract and label any transform. Until then show table pagination or an explicit incomplete-view notice.

Reference resolution is non-destructive: unknown study IDs or unavailable dataset revisions remain visible as unresolved context with a remove/reselect action. Server validation must not silently drop selected context. Cancelled HTTP requests do not guarantee server rollback; refetch conversation state before retrying an uncertain mutation.

## Ownership

Backend owns scientific metadata, source locators, datasets/revisions, observations, model output and its uncertainty methodology. Frontend owns presentation, local preferences, draft editing, staged bytes, selected view and accessibility. Demo repository owns deterministic examples and local CRUD only. User notes remain user notes in every mode. No frontend adapter produces new scientific measurements or predictions.

## Phase 2 simulation extension — proposed, not implemented

The latest addendum restores the timing gate. The detailed [Simulation API proposal](docs/PHASE_2_API_CONTRACT.md) adds typed model capabilities/validation, configuration revisions, sessions, asynchronous runs, exact frames/fields/measurements, provenance, warnings and captured AI context. Existing ResearchApi endpoints and Phase 1 persisted records remain intact. A future separate SimulationApi shares the current transport conventions and explicit data mode.

Primary proposed additions:

| Endpoint family | Purpose |
| --- | --- |
| `/api/v1/simulation-models` | Exact model/version catalog and declared capabilities |
| `/api/v1/simulation-configurations/validate` | Structural/applicability feedback, without computation |
| `/api/v1/simulation-sessions` and `/:id/revisions`, `/:id/forks` | Saved metadata, immutable configurations and explicit branching |
| `/api/v1/simulation-sessions/:id/runs` | Idempotent asynchronous submission; 202 receipt |
| `/api/v1/simulation-runs/:runId` and `/cancel` | Authoritative job status and requested cancellation |
| `/api/v1/simulation-runs/:runId/frames` and frame field payloads | Ordered frame manifest and bounded scientific values |
| `/api/v1/simulation-runs/:runId/results` | Source-identified measurements and mapped result series |
| `/api/v1/resources/:studyId/simulation` | Recorded/model-backed preview or an explicit unavailable capability |
| `/api/v1/simulation-contexts` | Immutable Copilot/chat context across navigation and refresh |

Example run request:

```json
{
  "configurationRevisionId": "example-revision-b",
  "applicabilityReceiptId": "example-structural-receipt"
}
```

Example asynchronous receipt for a clearly illustrative fixture replay:

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

Polling is the initial proposed transport. Playback pause does not pause computation. A cancel 202 does not prove cancellation. Errors include stale revisions, out-of-scope applicability, unsupported representation, mismatched frame identity, expired output and unavailable computation, with no fallback to simulated science. See the linked proposal for complete payloads, invariants, error cases and unresolved Flask decisions.

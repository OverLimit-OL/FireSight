# Flask team handoff

For the current Simulation Studio adapter, begin with [PHASE_2_CLIENT_CONTRACT.md](PHASE_2_CLIENT_CONTRACT.md). It distinguishes the implemented point-sample profile from the broader planning API. Both research and simulation HTTP modes fail explicitly when Flask is unavailable.

The React frontend, local mock repository and validated HttpResearchApi are implemented. This guide describes the proposed Flask contract; no backend code, AI calls, database schema or authentication has been implemented. Read the implemented-client differences at the start of API_CONTRACT.md before using older payload examples.

## Agree before integration

1. Review [API_CONTRACT.md](../API_CONTRACT.md), especially envelope shape, nullable scientific fields, dataset revisions, immutable Lab snapshots and evidence locators.
2. Confirm the proposed synchronous message operation. If processing will exceed normal request lifetimes, define a job/stream protocol with explicit error and cancellation semantics before the frontend promises streaming.
3. Confirm idempotency retention and revision conflicts. If unsupported, the UI will require explicit retry and reconcile uncertain sends instead of auto-retrying mutations.
4. Provide a small source-backed study record and its original source URL. A study description without measurements is a valid initial integration; do not fill gaps to satisfy the interface.
5. Agree hosted authentication/authorization, allowed origins, file policies and data ownership separately. These are not solved by the frontend contract.

## Connection plan

Future configuration is `VITE_DATA_MODE=http` with `VITE_API_BASE_URL` pointing to the approved API base, or explicit `demo` for local use. Vite values are publicly visible. No API keys or secrets belong there. The exact base-url joining convention will be origin plus `/api/v1` as documented by the adapter, avoiding doubled prefixes.

Prefer same-origin `/api/v1` through a development/deployment proxy. For separate origins, configure CORS on the backend for actual frontend origins; do not guess wildcard credential settings. The HTTP adapter centralizes abort signals, content-type checking, envelope decoding and typed errors. Components do not fetch Flask routes directly. Demo and HTTP query caches are separate; switching mode does not migrate records or upload files.

## Minimal evidence-ready payload

A ResearchStudy needs an ID, title, investigation, record level, objective/description if known, availability status and sources. Use null/empty-with-limitations for unknown conditions/instruments/materials. Sources should have an explicit publisher and locator when available; a retrieval date is not a publication date. Findings are separate, cited observations, not restatements of research goals.

An EvidenceReference connects a specific claim to a source and a location within it. Missing provenance should be returned as missing, not replaced by a generated citation. A confidence percentage needs a supplied method; uncertainty omitted means not reported. The frontend cannot certify source validity or model calibration.

Dataset metadata and row values are independent. Send variable IDs, units, revision and origin with every compatible dataset. Use null for missing values, preserve reported precision, and do not use JSON NaN/Infinity. Synthetic examples remain separate datasets with no NASA study attribution.

## Attachment boundary

The local demo never uploads. Selection stages bytes in memory and explicitly says they are unprocessed. Refresh requires reselection. For HTTP integration, `/files` returns a confirmed server ID; only that ID is sent in message fileIds. File parsing, malware/content validation, storage, access control and retention are backend responsibilities outside this frontend task. No third-party file transmission is implied.

## Joint acceptance run, after implementation

- Resolve a source-backed study from Resources, begin a context draft, send and reload the returned conversation.
- Open its evidence passage and navigate to the same resource section; inspect missing-source behavior too.
- Add a study without data to Lab and verify the ID survives save/reload.
- Load a real versioned dataset when provided; compare the returned sample table to its raw API values, units and nulls.
- Save a view, send its immutable snapshot to chat, then edit the Lab session and verify the old snapshot remains unchanged.
- Exercise 404, 409, 422, 429, 503, malformed JSON and network loss. Preserve drafts and working notes.
- Disconnect Flask in HTTP mode and verify no demo response appears.

These checks are pending. Frontend-only success in demo mode will not count as proof that Flask or a scientific model works.

## Phase 2 simulation handoff — planning only

The [simulation extension](PHASE_2_API_CONTRACT.md) is proposed documentation; the latest timing restriction defers its implementation. Keep scientific computation in the separate Flask service and scientific validation process. React/R3F only renders supplied output.

Before implementation/integration, agree:

- Immutable model/version, configuration revision, dataset revision and output manifest identities.
- Model validation evidence, evaluated scope, applicability receipts and explicit unknown/unsupported states.
- Asynchronous submission, polling/status ordering, idempotency, revision conflicts and cancellation races.
- Frame coordinate/units, dimensions, representations, payload size limits and exact measurement/annotation mappings.
- Source-backed Resource preview capabilities and honest unavailable responses for investigations without reconstructable data.
- AI context snapshots and preview/confirmation of structured proposals; no automatic mutation of a scientific run.
- Artifact authorization/retention and a clear separation of recorded data, computed results and illustrative fixtures.

Do not convert Phase 1 source/synthetic labels directly into a validated simulation mode. Existing dataset notebooks and chat histories remain readable, and the separate `/lab/studio/:simulationSessionId` route avoids collisions with legacy notebook IDs. Read the architecture and QA plan before implementing new services.

# Phase 2 architecture and migration plan

> Historical planning specification. The user explicitly lifted the timing gate on November 1, 2026. See the [implementation report](PHASE_2_IMPLEMENTATION_REPORT.md) and [actual client contract](PHASE_2_CLIENT_CONTRACT.md) for delivered scope and verification. Statements below about work not yet started describe the earlier planning stage.

Planning only. No new application code or dependency installation is authorized before the timing gate in [PHASE_2_DESIGN.md](PHASE_2_DESIGN.md).

## Three independent layers

| Layer | Owner | Responsibility | Forbidden shortcut |
| --- | --- | --- | --- |
| Scientific computation | Separate Flask/scientific team | Models, applicability, numerical execution, source datasets, validation, uncertainties and derived results | A renderer or language model presented as a validated solver |
| Application controller | Frontend services + React | Configuration drafts/revisions, job lifecycle, frame loading, shared selection, playback, comparison and AI context | Renderer-owned run state or mutable old results |
| Visualization | Frontend view adapters | Draw supplied states and expose exact values/provenance through accessible views | Inventing physical behavior, spatial reconstruction or intermediate measurements |

The controller treats outputs as immutable scientific records. Rendering preferences, scientific configuration and job state have independent identities and lifecycles. None of the graphical libraries below performs the required scientific validation.

## Changes relative to the current repository

The current `ResearchApi` owns conversations, studies, dataset rows and legacy LabSession records. Keep it intact. Add a separate `SimulationApi`, sharing transport/error conventions, runtime decoding, global demo/http configuration and TanStack Query. Both providers must use the same explicit data mode; an HTTP simulation failure cannot instantiate a mock adapter.

Preserve existing `frontend/src/features/lab/` as the dataset notebook. New studio features live alongside it rather than replacing it. Reuse existing EvidencePanel, composer/context patterns, UI primitives, shell and tokens. Extract small shared provenance/selection components when both old and new flows actually need them; avoid a large generic simulation framework.

```text
frontend/src/
  features/
    simulations/
      overview/             mixed saved-work index and capability status
      creation/             guided model/configuration selection
      studio/               attached regions, resize/collapse behavior
      configuration/        schema-driven forms and immutable revisions
      runs/                 job status, history and comparison
      playback/             discrete frame selection and transport controls
      copilot/              captured context and reviewed proposals
    resources/
      interactive/          capability-aware embedded preview and mappings
  components/scientific/
    viewport/
      ScientificViewport    common frame/view/selection interface
      TwoDimensionalView    sample/slice view, no WebGL requirement
      ThreeDimensionalView  lazy-loaded R3F adapter for actual 3D output
      MeasurementOverlay    HTML labels and exact record values
      ScientificLegend     quantity, units, range, origin, missing values
      SelectionInspector    shared sample/entity list and keyboard access
  services/
    simulation/             SimulationApi, HTTP/mock adapters, error decoding
    mock/simulation/        fixture manifests and deterministic job scripts
  types/
    simulation              versioned runtime schemas and domain types
  lib/
    simulation/             capability checks, selection/compatibility rules
```

Names describe proposed responsibilities, not files already created. Split state orchestration from region components; do not accumulate a new monolithic Lab page.

## State ownership

| State | Owner and persistence |
| --- | --- |
| Model catalog, validation evidence, sessions, revisions, jobs | SimulationApi; Query cache keyed by mode and immutable IDs/version |
| Unsaved configuration | Controller draft repository; base revision ID retained; explicit dirty state |
| Saved configuration | Immutable SimulationRevision; server/demo repository never mutates it |
| Active run and comparison run | URL `run`/`compareRun`, verified against the session |
| Selected frame | URL `frame`; controller resolves it against the active run's manifest |
| View, field, slice and entity | Controller; shareable view/field/slice IDs in URL, larger selection snapshot stored by ID |
| Playback status/speed | Local controller; never stored as numerical job status; loads paused |
| Camera pose and region widths | Presentation preferences; explicitly separate from model inputs |
| Frame buffers and GPU resources | Bounded transient caches with ownership and release rules |
| AI question context | Immutable AIAnalysisContext snapshot; later scrubbing does not alter it |

Do not put typed arrays, WebGL objects or File objects into URLs, router state or localStorage. Small metadata/drafts can use versioned browser storage; output buffers remain transient or in a bounded cache. Add IndexedDB only if actual fixture size or offline requirements justify it. Show quota/blocked/corrupt-storage recovery explicitly.

## Configuration, run and playback state machines

Configuration: clean revision → edited draft → validation feedback → saved new revision. A rejected save retains the draft and its original base. A run captures a saved revision ID and model version. Editing afterward does not change that run's identity; derived `resultsAreStaleForDraft` is a comparison, not duplicated mutable state.

Job: queued → running → completed/failed; queued/running → cancelling → cancelled or a late completed/failed result. Terminal states do not regress on delayed responses. Unknown status remains unknown and visible. A cancel acknowledgement is not completion; aborting a browser fetch does not cancel a backend computation. No invented progress percentages.

Playback: paused ↔ playing → ended; scrubbing, stepping, changing runs, context loss or missing frames pauses it. Restart selects the first available frame without recomputation. The job may continue while playback is paused. Pausing the job is not exposed unless a future explicit computation capability supports it.

Treat completed-but-output-pending separately from frames-ready. The first increment plays completed, validated manifests only. Partial results are not silently enabled; a future capability must explicitly identify completeness and limitations.

## Shared time and selection protocol

The selected identity is `(runId, configurationRevisionId, frameId)`, not an array index or wall clock. Field, sample/entity and measurement IDs extend it. Exactly one controller publishes that selection to viewport, charts, timeline and inspector.

Frame manifests declare ordered unique indices and a coordinate definition: physical time with a reported unit, or a dimensionless step. Validate ordering, finite values, schema version, run/revision/model identity and payload hashes before use. Duplicate times are legal only with distinct frame IDs and a documented ordering; they cannot become ambiguous scrubber indices.

The scrubber is indexed by available frame order. Requested times without exact frames must show an explicit snap decision and displayed timestamp, never an interpolated measurement. A chart point changes time only if its record carries an exact frame mapping. Discrete fixture cells are not smoothed. Two views of the same field must resolve the same sample IDs and scalar values.

A 2D slice of 3D points selects an exact declared plane/slice from supplied data. The first version does not resample arbitrary planes. Projection or slicing is labeled as a view of the source geometry, not a new computed experiment. Missing samples remain missing and selectable where IDs exist.

## Asynchronous transport

Start with bounded polling using TanStack Query; see the contract for endpoints. A run submission returns 202 and a run ID/status link. Poll at a proposed 2-second interval while visible, backing off on transient failures and respecting Retry-After. Stop at terminal status, unsubscribe on unmount, and refetch authoritative status when reconnecting. Mark stale network status as connection unknown rather than pretending computation stopped.

Mutations require idempotency and revision preconditions agreed with Flask. An uncertain submission keeps its operation ID for reconciliation; changing its body requires a new operation ID. A timed-out cancel is reconciled through status, not replayed blindly. No LLM or solver endpoint is implemented in this phase.

SSE can later replace polling behind the same service interface if the backend supports reconnect cursors and ordered status updates. Do not commit the UI to SSE/WebSockets now. A Web Worker may decode/validate large buffers, not solve combustion equations or create undocumented derived values.

## Frame delivery and performance

Use a lightweight frame manifest plus on-demand field payloads. The controller requests the current frame and a small adjacent window; cancel or deprioritize obsolete fetches and reject late payloads for another run. Cache by run/frame/field/schema/revision, not just frame number.

Initial proposed budgets: two adjacent frames prefetched, a 32 MiB transient frame-cache soft limit, DPR capped at 1.5 for 3D, one WebGL context per active studio and one visible interactive resource preview. These are starting engineering limits, not measured performance claims or scientific model constraints. Measure on actual available hardware and degrade display quality transparently without changing scientific values.

Keep chart decimation off for the small first fixture. Future decimation must carry method/parameters, preserve record mappings and extremes as documented, and retain access to original values. A downsampled display cannot become the basis of an unreported analysis result. Large outputs without an agreed representation produce an explicit unsupported-size state.

3D uses React.lazy/Suspense and on-demand rendering. Camera and buffer updates use refs/subscriptions rather than React setState on every GPU frame. Reuse typed buffers/geometries/materials, use instancing for repeated samples, and release owned geometries, textures, render targets, event listeners, timers and workers on exit. Do not dispose objects still shared by an active view. Stop playback when the document is hidden and after a WebGL context loss; recovery preserves the selected frame.

Scientific color maps use unlit materials and a documented transfer function so lighting/tone mapping does not alter quantitative color meaning. No postprocessing, particle dynamics, shadows, external HDRI or automatic camera orbit. Camera motion is presentation only.

## Technology selection

| Technology | Decision |
| --- | --- |
| Existing Recharts | Retain for time series and exact-frame markers; keep the accessible sample table |
| SVG + a modest Canvas 2D adapter | Preferred first spatial presentation; SVG for small interactive sample sets, Canvas only when density justifies it; semantic inspector always outside the canvas |
| Three.js + React Three Fiber | Select for lazy 3D points/slices when actual rank-3 output exists; a renderer, not a physics engine |
| Drei | Add only selected controls/bounds helpers if they reduce code and pass compatibility checks; no effects/environment bundle by default |
| vtk.js | Keep as a future adapter candidate for actual volumetric/mesh outputs, not a second initial rendering stack |
| Plotly | Do not add alongside existing Recharts/R3F for the first increment; reconsider if a concrete scientific plotting requirement exceeds them |
| Graphical collision/particle physics packages | Do not add; they provide no validated combustion capability for this task |

Rationale is an architectural judgment based on output requirements and official documentation, not a bundle-size or benchmark comparison. Registry peer metadata checked on October 31: R3F 9.8.2 declares React/ReactDOM `>=19 <19.4` and Three `>=0.156`; Drei 10.7.9 declares React 19, R3F 9 and Three `>=0.159`. The existing React 19.3.1 fits those declared ranges. Three 0.187.0, vtk.js 38.0.4 and Plotly dist 4.2.0 were observed in registry metadata. No packages were installed; runtime/WebGL compatibility is untested and must be rechecked at implementation.

## Accessibility and failure recovery

Canvas is an enhancement, never the sole means of selecting data. Provide a titled region, text summary, quantity/unit/source legend, named entity/sample list, numeric readout and table. Keyboard controls include camera presets, pan/zoom/reset, exact frame stepping and direct frame selection. Do not trap Tab in the canvas. Tooltip values must also be available by focus/selection.

Use a native or inspected accessible slider with exact-frame step semantics and meaningful value text. Do not depend on touch assistive technology translating slider gestures; adjacent buttons and a frame select are required. Resize handles follow accessible separator/window-splitter behavior, with collapse/reset alternatives. The WAI window-splitter pattern notes that its review is incomplete; treat it as design guidance and require keyboard and assistive-technology verification of the chosen primitive.

WebGL unavailable/context loss/unsupported field encodings lead to 2D or table views of the same available record, preserving frame/entity IDs. If no faithful fallback exists, expose the data and limitation rather than draw substitute geometry. Reduced motion disables automatic playback; user-initiated discrete inspection remains available. Accessible DOM descriptions never claim a field's colors prove physical accuracy.

## Migration and integration boundaries

- Leave `firesight:demo:labs:v1`, conversations and existing LabViewSnapshot data intact. Store new simulation records in a separate versioned namespace. Importing an old notebook creates a new simulation draft with a parent reference; it is never an automatic conversion to a computed run.
- Extend ResearchContext with an optional nullable simulation snapshot reference, with old records decoding to null. Update both transport adapters and persistence schemas together; verify the field is not stripped. No old AI message is rewritten to carry a newer run.
- Resource preview capability endpoints are independent of ordinary study metadata. An unavailable preview does not hide a study or its original sources. Existing Open in Lab continues to offer the data notebook; Open Full Lab selects a studio only when supported.
- New session/run/revision IDs are opaque. The separate studio route avoids backend ID assumptions. Exact model, dataset and output schema versions remain pinned in every saved revision/run/context.
- Backend controls scientific validation, execution, uncertainty, authorization and output availability. Frontend controls display, accessibility, user confirmation and context. No client-side status switch can certify a model.

## Research references

Primary sources consulted on October 31: [R3F introduction/React pairing](https://r3f.docs.pmnd.rs/getting-started/introduction), [on-demand rendering and performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Canvas configuration and fallbacks](https://r3f.docs.pmnd.rs/api/canvas), [Three.js disposal manual](https://threejs.org/manual/#en/how-to-dispose-of-objects), [vtk.js documentation index](https://kitware.github.io/vtk-js/llms.txt), [Plotly JavaScript](https://plotly.com/javascript/), [Recharts Line API](https://recharts.github.io/en-US/api/Line/), and [WAI slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), and [WAI window-splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).

Several Three.js/VTK deep links redirected or could not be fetched directly; use the official documentation indexes and recheck exact API references before coding. The specific challenge page again returned 502; the latest user instruction, not a successful rule-page fetch, enforces the current timing boundary.

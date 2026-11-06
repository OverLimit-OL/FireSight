# Phase 2 execution gates and QA plan

> Historical planning specification. The user explicitly lifted the timing gate on November 1, 2026. See the [implementation report](PHASE_2_IMPLEMENTATION_REPORT.md) and [actual client contract](PHASE_2_CLIENT_CONTRACT.md) for delivered scope and verification. Statements below about work not yet started describe the earlier planning stage.

**Status: specification complete; implementation and Phase 2 tests not started.** Prepared October 31, 2026; documentation reviewed November 1, 2026. The latest user addendum restores the competition timing gate. The Phase 1 application and its historical QA evidence remain intact; those results do not prove any Phase 2 behavior.

## Preflight findings

- Existing React frontend, strict TypeScript schemas, ResearchApi adapters, legacy Lab notebooks, source records, Evidence Panel, chat and Playwright tests were inspected.
- AGENTS.md was read and is not modified. Its historical planning-only description does not erase the existing application; the newest Phase 2 timing restriction applies to new work.
- The initial clock check returned October 31, 2026; the latest workspace date is November 1, 2026 (Africa/Cairo), still before the stated November 14–15 event. The exact permitted start hour for the selected event is not established. The official challenge page returned 502; no permission to begin is inferred from that failure.
- Relevant installed skills and primary documentation were reviewed. Package metadata was queried read-only. No packages, skills, renderer files, fixture bundles or executable simulation code were installed/generated for this phase.

## Skill application

| Skill | Application in this planning turn |
| --- | --- |
| frontend-design | Continued the Evidence notebook identity; compared three studio layouts; rejected floating palettes/decorative flames; specified one meaningful run-identity strip and responsive wireframes |
| vercel:react-best-practices | Preserved feature/API boundaries; separate state ownership; lazy 3D loading; bounded cache and selective subscriptions; no duplicated derived stale-result state |
| web-design-guidelines | Fetched current Vercel rules and reviewed planned focus, form labels, route state, reduced motion, data alternatives, touch behavior and overflow |
| playwright | Applied the existing skill's open/snapshot/interaction/capture discipline to the future test matrix; no new browser tests were run because no Phase 2 UI exists |
| react-three-fiber | Read installed guidance; applied on-demand rendering, no setState in the GPU frame loop, typed reusable scene components, Suspense and disposal ownership |
| threejs-webgl | Read installed guidance; applied coordinate discipline, geometry/buffer reuse, picking identities, GPU-resource cleanup and explicit fallback requirements |
| shadcn | Retained the existing customized primitives and token architecture in the design; future new primitives require CLI docs/source inspection, not default styling |

No additional skill was installed. Visual animation, collision and particle examples in graphical skills are not adopted as scientific solvers. Live official docs and the current React environment take precedence over older skill snippets, particularly React/R3F version pairing and scientific color handling.

Research sources and observed package versions are recorded in [PHASE_2_ARCHITECTURE.md](PHASE_2_ARCHITECTURE.md). Peer ranges were checked, not runtime/GPU compatibility. vtk.js/Plotly were evaluated as alternatives; neither is selected as an additional initial dependency.

## Stage 2.1 — Design system, after permission gate

- [ ] Verify the selected event's actual start time/timezone and current instructions before writing project implementation code.
- [ ] Preserve the Phase 1 source, routes, data and design identity; record a reversible baseline.
- [ ] Implement the Lab overview, New Experiment flow and studio regions from the wireframes.
- [ ] Add a persistent scientific-mode label, run/configuration identity strip and stale-draft treatment.
- [ ] Reuse existing UI primitives; fetch current official docs before adding resize/slider/tab controls and inspect generated source.
- [ ] Implement keyboard resizing/collapse and mobile single-region behavior without crushing the viewport.

## Stage 2.2 — Frontend simulation infrastructure

- [ ] Add versioned runtime schemas for all proposed scientific/controller models.
- [ ] Add SimulationApi with separate HTTP/mock adapters sharing explicit global mode selection.
- [ ] Keep configuration, numerical job and visual playback state independent.
- [ ] Validate run/model/revision/frame/field identity and finite values before display.
- [ ] Implement exact-frame selection, timeline stepping/scrubbing and chart mapping.
- [ ] Implement the SVG/2D sample view and semantic sample table first.
- [ ] Recheck compatible stable Three/R3F/Drei peer versions, license/security information and actual build behavior before installation.
- [ ] Add lazy 3D only for explicit rank-3 sample output, with camera controls, exact picking and HTML inspector equivalents.
- [ ] Add WebGL-unavailable/context-loss recovery and release owned GPU/buffer resources.
- [ ] Keep interpolation and silent scientific decimation disabled.

## Stage 2.3 — Research workflow

- [ ] Implement create/open/save/rename/tag/fork flows, immutable configuration revisions and parent references.
- [ ] Add job submission/polling/cancel interfaces without pausing computation through playback controls.
- [ ] Keep old results tied to their earlier configuration after edits; require an explicit new revision/run.
- [ ] Implement comparison of pinned runs with origin/input/provenance summaries and compatibility explanations.
- [ ] Add Resource preview capabilities and exact observation/annotation mappings where supplied.
- [ ] Preserve legacy data-notebook access for sources without reconstruction/model support.
- [ ] Capture immutable Copilot context and retain it through Lab → Chat and Resource → Chat refreshes.
- [ ] Preview and confirm structured AI proposals; reject outdated bases and never submit a run implicitly.

## Stage 2.4 — Honest demonstration

- [ ] Create two small pre-authored field-sequence bundles with explicit synthetic coordinates/scalars and dimensionless steps.
- [ ] Add a catalog entry labeled Illustrative / Not Scientifically Validated; do not add fabricated oxygen/gravity/fuel inputs.
- [ ] Make configuration presets select documented fixture sequences; changing a sequence creates a new revision and illustrative run.
- [ ] Demonstrate deterministic queued/running/completed/failed/cancellation flows without a physics calculation.
- [ ] Verify that every preview, plot, comparison and AI context retains its illustrative origin and limitations.
- [ ] Keep current NASA overview records unavailable for reconstruction unless real usable sources/mappings are supplied.

## Stage 2.5 — Scientific backend readiness

- [ ] Review [the simulation contract](PHASE_2_API_CONTRACT.md) with Flask/scientific owners.
- [ ] Agree catalog/version availability, applicability/validation criteria, idempotency, revision and artifact-retention semantics.
- [ ] Agree asynchronous status ordering, field encodings, size limits, unit/coordinate definitions and frame mappings.
- [ ] Agree authorization, context-snapshot access and chat extension support before hosted HTTP use.
- [ ] Validate controlled HTTP responses/outages with no mock fallback; report actual Flask integration separately.
- [ ] Keep solver, numerical evaluation, scientific validation and real AI integration outside this frontend work.

## Required behavioral tests

All cases below are **planned, not run**. Add focused Vitest/controller tests and Playwright flows; keep the existing Phase 1 suite.

| Concern | Required case and observable proof |
| --- | --- |
| Mode honesty | Recorded, computed-unverified and illustrative records remain distinct; missing/mismatched/withdrawn validation never produces a validated label |
| Applicability | Out-of-range/missing/unsupported input yields field feedback; no silent clamping or fabricated defaults |
| Revisions | Edit inputs after run A; A still shows its original revision/values; run B uses a newly saved revision |
| Forks | Child has new IDs and a parent reference; old results remain parent results until a child run completes |
| Jobs | Queued/running/error/terminal transitions, stale statusSequence, unavailable service, reconnect and uncertain submission |
| Cancellation | 202 means requested, not cancelled; late completion is handled; fetch abort is not server cancellation |
| Playback | Pause/resume/restart/rate/step affect playback only; reload loads paused; hidden document/reduced motion does not auto-play |
| Time fidelity | Irregular times, duplicate-coordinate frame IDs, unmapped chart points and missing frames do not trigger invented interpolation |
| View synchronization | 2D/3D/table preserve run, revision, frame, field and sample ID; exact values match source payloads |
| Picking | Picking after missing/filtered samples selects the payload's original ID, not an array-index approximation |
| Output validity | Non-finite values, rank mismatch, wrong run/frame/field digest, unsupported encoding and expired outputs are rejected visibly |
| Comparison | Incompatible quantity/unit/time/coordinate fields show a reason; no guessed alignment or invented difference score |
| Resources | Missing preview is distinct from API outage; mapped observations highlight exact entities; no mapping means no fake highlight |
| Context | Resource → Studio → Copilot → Chat retains source/model/version/revision/run/frame/evidence IDs after refresh |
| AI proposals | Preview/cancel leaves state unchanged; confirm applies only to the reviewed current base; configuration proposals do not execute jobs |
| Persistence | Old Phase 1 notebooks/messages remain readable; new simulation storage is separate; stale saves and quota failures retain working drafts |
| GPU failure | Unsupported WebGL, context loss/restoration and low-performance mode preserve accessible values and selection |
| Cleanup | Repeated open/close/run changes do not leave growing buffers, contexts, listeners, timers or workers; measure rather than assume zero internal GPU allocations |

## Visual and accessibility matrix

Capture 1440, 1280, 768, 390 and 320 px in both themes, including:

- Overview with no models, saved work and an unavailable API.
- New Experiment model/configuration/review steps, errors and unsaved state.
- Studio with 2D, eligible 3D, no frames, missing geometry, dirty configuration, running job and failure/cancellation.
- Timeline keyboard focus, selected sparse sample, comparison and accessible table.
- Copilot captured context, evidence sheet, AI proposal preview/cancel/confirm.
- Supported recorded Resource preview and the current no-reconstruction treatment.

Inspect screenshots visually and fix spacing, label truncation, hidden status, units, source hierarchy, overlapping sheets, crushed panels and page-wide overflow. The canvas must not become a decorative focal point without useful data. Record screenshot/trace paths under the existing `frontend/output/playwright/` convention, with phase/run/mode/view/theme/width identifiers.

Use real browser actions: open → fresh snapshot → action → re-snapshot → screenshot/trace. Automated tests should use stable semantic locators and await exact rendered frames/point geometry, not only a loaded canvas. Run axe plus manual keyboard/focus review. Test a 3D-disabled environment rather than assume a GPU exists.

Test 200% zoom/reflow, OS theme changes, reduced motion and direct route refresh. Verify touch slider alternatives on an actual assistive-technology device before claiming that behavior. A headless WebGL render is not physical GPU performance or mobile keyboard proof. Do not claim screen-reader certification from axe results.

## Acceptance evidence matrix

| Phase 2 criterion | Planned evidence |
| --- | --- |
| Dedicated studio and computation/rendering separation | Feature boundaries + configure/run/inspect browser flow |
| 2D and eligible 3D | Same-frame/value assertions; rank-2 source never enables volumetric view |
| Reusable viewport | Resource preview and studio render the same identified payload through shared adapters |
| Configuration/create/open/save/fork | Revision/parent identity tests and refresh/reopen journey |
| Run lifecycle and timeline | Status/playback state-machine tests and exact-frame browser assertions |
| Copilot and cross-page context | Immutable context snapshot survives edits, scrubbing and navigation |
| Resource integration | Source-backed mappings or honest unavailable state with original references retained |
| Provenance and validity | Mode/validation/limitations displayed in viewport, compare, Copilot and chat |
| Typed Flask contract | Runtime schema tests and controlled HTTP failures; no live scientific claims |
| Honest demo and visual QA | Persistent illustrative labels, fixture origin tests, screenshots at all target widths |

No Phase 2 acceptance item is complete until its implementation and evidence exist. Backend scientific accuracy, empirical validation and real solver completion are separate gates and cannot be checked off by this frontend plan.

## Planning verification

Completed in this turn: repository/skill inspection, primary-documentation research, read-only peer dependency checks, architecture, wireframes, proposed typed contracts and this execution/test matrix. The initial planning check recorded eight documents with no link, fence, JSON-example or whitespace errors, all 14 required simulation model declarations, and 73 unchanged frontend files. The temporary hash manifest is no longer available during the November 1 continuation, so that historical hash comparison cannot be repeated. This continuation edits documentation only; a fresh document integrity check is recorded below. Application build/tests/browser QA are not rerun for documentation-only changes, and no Phase 2 runtime result is claimed.

November 1 continuation: checked 8 planning/index/handoff documents, parsed 7 JSON examples, and confirmed all 14 required simulation type declarations. Relative file links, fenced blocks and trailing whitespace checks passed with zero errors. No application source, dependencies or AGENTS.md were changed in this continuation.

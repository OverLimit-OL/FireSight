# Phase 2 — Scientific Simulation Studio

> Historical planning specification. The user explicitly lifted the timing gate on November 1, 2026. See the [implementation report](PHASE_2_IMPLEMENTATION_REPORT.md) and [actual client contract](PHASE_2_CLIENT_CONTRACT.md) for delivered scope and verification. Statements below about work not yet started describe the earlier planning stage.

Planning and design specification · October 31, 2026 · **not implemented**.

The latest addendum explicitly restores the competition timing boundary. The current clock was checked on October 31; this phase remains documentation-only. The existing Phase 1 application is preserved. No solver, renderer, fixture bundle, dependency, route or simulation service is added by this package. Check the selected event's actual permitted start time before implementation; no automatic start is scheduled.

## Product decision

Extend the Evidence notebook identity into an instrument workspace: configuration on the left, a source-aware viewport in the center, research context on the right, and a shared timeline beneath. Preserve the current shell, colors, typography, conversations, library, evidence UI and Flask separation.

The signature is a **run identity strip**, connecting every visible result to its immutable configuration revision, model version, source and selected frame. It is useful even when nothing can be simulated. It replaces decorative flame graphics, fictional telemetry and disconnected analysis cards.

Three layout treatments were considered: a permanent three-column console, a large canvas with floating palettes, and a document-like studio with collapsible regions. Select the third: floating palettes obscure evidence, while permanent columns crush the viewport on ordinary laptops. Use attached panels and a single timeline; collapse by available content width.

## Three scientific modes

| Mode | Required identification | Available actions |
| --- | --- | --- |
| Recorded Experiment | Recording/dataset ID, revision, original source, measured quantities, mapping limits | Inspect and replay supplied states; no editable physical inputs or new computed outcome |
| Validated Model Simulation | Identified model/version, supplied validation evidence, applicability assessment for this configuration, run provenance and limitations | Configure supported inputs; submit an asynchronous run; inspect supplied output |
| Demonstration / Unverified Scenario | Persistent **Illustrative / Not Scientifically Validated**, fixture/model identity, explicit origin and limitations | Exercise configuration/run/playback/fork/compare flows with transparent fixture outputs |

A model's name or a frontend enum cannot establish validation. The validated label requires the complete evidence/scope conditions described in the contract. Missing or contradictory evidence downgrades the presentation to unverified, with an explanation. Recorded data stays recorded, including when compared with a prediction. A polished 3D image changes none of these classifications.

Display the mode in the overview, creation review, studio header, viewport caption, comparison, Copilot context and any future export. Use text and an icon, never color alone. Retain `Demo · local only` in the existing global header; global data mode and scientific result classification are separate concepts.

## Routes and preservation of Phase 1

| Route | Planned behavior |
| --- | --- |
| `/lab` | Overview of experiments, saved configurations, model capabilities and existing dataset notebooks |
| `/lab/new` | Guided New Experiment flow |
| `/lab/studio/:simulationSessionId` | Dedicated Simulation Studio |
| `/lab/:sessionId` | Existing Phase 1 dataset notebook, unchanged |
| `/resources/:studyId?view=interactive` | Study detail with its contextual interactive section selected |

The extra `/lab/studio/` segment is deliberate: legacy notebook IDs and new simulation-session IDs need not share a backend namespace. Existing `/lab/:sessionId` bookmarks and saved v1 data must continue to work. Do not infer record kind from ID spelling or HTTP failure. If canonical routes are unified later, agree a typed resolver and migration first. Add static routes before the legacy parameter route and test direct refresh/back/forward.

The overview interleaves typed links to both kinds of saved work. Open an existing experiment in one click; show title, mode, model version, latest run state and last user update, without invented scientific statistics. Unavailable model catalogs display a recovery action; they never cause automatic demo substitution.

## Studio regions and responsive behavior

Preserve Phase 1 semantic tokens. Use copper for deliberate actions, source blue for evidence/selection, and a separate scientific scalar legend. No glow, smoke particles, photorealistic flame, bloom or cinematic camera movement.

Configuration: preferred 260 px, minimum 240 px. Research panel: preferred 280 px, minimum 240 px. Central viewport: at least 560 px on desktop. Include gaps and the existing sidebar before deciding to show three regions. At approximately 1440 px with the expanded shell, the research panel normally collapses; opening it uses an accessible sheet. Show all three only when the actual content region can accommodate them.

At tablet widths, collapse configuration and intelligence into labeled regions; keep the viewport and timeline together. At 390/320 px, show a single column with View, Configure, Data and Research tabs. No simultaneous narrow panels. Keep mode, active run and timestamp visible above the selected region. Do not hide limitations inside a hover tooltip.

Desktop resize separators support keyboard increments and pointer drag, with named controls, reported widths and reset actions. Persist widths as view preferences, clamp them after resize, and never reduce the viewport below its minimum. On mobile, use titled dialogs/sheets with focus restoration. Data tables may scroll within a named region; the whole page must reflow.

### Configuration region

Show source study, model identity/version, applicable environment, typed input controls and dataset bindings. Group editable model inputs separately from computed outputs and visualization preferences. Units, allowable ranges and constraints come from the selected model definition; unknown limits are unknown, not invented slider endpoints.

Numeric inputs use labeled fields with units and inline errors, optionally paired with an accessible slider for bounded values. Enumerated inputs use a select/radio group. Presets name their source and model version. Restore defaults is explicit and produces a draft; it does not overwrite old results. A recorded experiment exposes source conditions read-only.

Changing scientific inputs creates a dirty draft. Save creates an immutable configuration revision. Every run retains its original revision. While inspecting an older run, show `Results from revision N · draft inputs have changed`, with Show run inputs, Discard draft and Save new revision actions. Do not recolor or relabel old output to suggest recomputation.

### Scientific viewport

One ScientificViewport takes a selected immutable frame and a view specification. 2D and 3D consume that same frame, selected field, selection IDs, coordinate system and unit metadata. Changing the renderer does not start a new run or change scientific values.

Use 2D by default. Provide 3D only when the output contains explicit 3D sample positions/geometry or volume data supported by the chosen adapter. A rank-2 field is not extruded into a volume. Scalar values displayed as a height plot, if ever supported, must be named as a value-axis plot rather than a spatial reconstruction; it is out of the first increment.

First adapters: a discrete 2D sample/slice view, an accessible sample table, and a 3D point/slice representation for supplied 3D coordinates. A synthetic 3D fixture can exercise rendering, but never becomes a reconstruction of a NASA experiment. No renderer computes combustion, changes field values or invents geometry from study prose.

Toolbar: supported view mode, field, slice selector when available, camera reset, orthographic orientations, pan/zoom controls and selection clear. Every camera gesture has a button/keyboard alternative. Keep measurement overlays in semantic HTML where practical; a keyboard-accessible entity/sample list mirrors picking. Coordinate labels come from the output, not assumed meters or a hardcoded laboratory orientation.

Color mapping must have a visible quantity, units, range and missing-value indicator. Unknown units are explicitly named. Use a stable shared range for compatible comparisons; disclose any range change. Nearest-sample coloring is the default for discrete fixtures; a smooth field must not imply an unsupported interpolation method. Scientific values come from records, not pixel colors or GPU readback.

### Timeline and analysis region

Use exact frame IDs and their supplied coordinate values, including irregular intervals. A frame-index slider displays the actual time/step in `aria-valuetext`; adjacent Previous/Next and a frame select provide equivalent controls. Scrubbing, chart selection, viewport and the inspector all refer to the same displayed frame.

Play, Pause playback, Resume, Restart and speed controls affect visual playback only. Use frame timestamps when meaningful; a dimensionless demonstration sequence is labeled Demo step, not seconds. Skip no scientific frames silently; if presentation cannot keep up, slow playback or disclose a skipped-display policy while retaining all inspectable frames. No synthesized intermediate states.

Event markers need a source or explicit fixture origin and an exact frame mapping. Clicking a measurement without a mapping selects the record but explains that no frame is associated; it does not move to a guessed timestamp. Pause before manual scrubbing. Preserve the selected frame and entity through 2D/3D changes and WebGL fallback.

### Research Intelligence and Copilot

Tabs: Selection, Model & evidence, Copilot. Selection shows frame/sample identity, values, units and source. Model & evidence exposes version, applicability, validation references and missing assumptions using the existing Evidence Panel.

Ask AI About This captures session ID, saved configuration revision, run ID, exact frame/time coordinate, view, sample/measurement IDs and evidence IDs. Show that captured context as removable chips. Subsequent scrubbing must not silently change an already submitted question's context. Offer an explicit Update to current selection action for unsent Copilot drafts.

Demo Copilot responses remain scripted, with that label and no implication that files or physical processes were analyzed. Open in Research Chat saves a context snapshot and navigates by snapshot ID. Add simulation context to the existing chat contract without replacing study IDs or legacy Lab snapshots.

AI suggestions are typed proposals, not executable commands. Review shows the base revision, proposed input/view diff, units and evidence/limitations. Apply only after explicit confirmation and a fresh base-revision check. A configuration suggestion creates a new draft/revision; submitting a job remains a separate user action. Never alter a running computation.

## Creation, saving and branching

New Experiment is prominent on the overview and remains available in the studio. The guided flow is:

1. Select a supported model family and inspect its scientific mode.
2. Choose a blank configuration, a compatible study reference or a saved experiment.
3. Edit only declared inputs and bind compatible dataset revisions.
4. Review evidence, applicability constraints, missing information and output capabilities.
5. Save the configuration and create the session; choose Run explicitly afterward.

Do not assume a familiar NASA investigation has a usable model. With an empty real model catalog, show why computation is unavailable, retain the research reference and offer the existing data notebook. A separate opt-in can open an unrelated illustrative example in demo mode; never fill an unavailable reconstruction with that example.

Rename changes session metadata only. Save configuration creates a new revision. Fork creates a new session and initial revision with parent session/revision/run references; old results remain linked to the parent and are read-only references, not newly computed child results. A fork has no own result until its own run completes. Organize with local user tags/search in the overview; no invented scientific categorization.

Run comparison pins two run IDs/revisions. It shows inputs and provenance before results. Overlay only quantities with compatible units, coordinate/time definitions and explicit correspondence. Otherwise show side-by-side views and a reason. Numerical differences, residuals or validation scores are absent unless supplied through a documented result definition; never infer a validation verdict from visual similarity.

## Resource-linked experiences

Add one Interactive Experiment View section integrated with Objective/Setup/Variables/Observations/Results/Sources, not a canvas per paragraph. Its response declares unavailable, recorded or model-backed capabilities. Preview and studio reuse the viewport controller and frame identity.

When supplied: show compact mode/source captions, frame controls, mapped annotations, the exact selected state, and Open Full Lab, Explore This Configuration, Ask AI and Compare Results actions with genuine prerequisites. The full studio preserves source, model/version, revision, frame, field and selected annotation. A new draft configuration is not represented as an old completed run.

When unavailable: retain the real objective and source links; state the missing recording, spatial mapping, model or validation. Show actual existing files/measurements only if connected. Offer Open data notebook or Save study context. Do not show a synthetic NASA preview. Observation↔visual highlighting is enabled only for explicitly supplied mappings; missing mappings remain a readable limitation.

## Honest demonstration scope

Plan a small, versioned **illustrative field-sequence** catalog entry, not a combustion solver. It selects between two pre-authored sample bundles with explicitly synthetic 3D coordinates, scalar values, frame IDs and dimensionless steps. A 2D view uses an exact declared slice of those same samples.

Its only run-affecting input is the supported fixture sequence/preset. Camera, color range and slice visibility are view preferences. No oxygen, pressure, gravity, ignition, fuel or suppression sliders are fabricated. Changing presets creates a new revision and a new illustrative job; replaying the same preset yields the same supplied frames. Reruns are labeled replay/materialization, not numerical integration.

The future mock service may demonstrate queued/running/completed/failed/cancelling/cancelled transitions with deterministic scripted delays and optional failure scenarios. It loads fixtures without a physical calculation. Any progress percentage must describe real fixture-loading work or be omitted. No actual fixture files or generator are created before the timing gate.

## Design review gates

Reject any implementation that hides mode/limits, confuses playback with computation, turns camera motion into fake physics, shrinks scientific values to fit panels, or invents unsupported editable variables. Evaluate both themes, all five Phase 1 widths and long provenance text. The studio should remain useful when no simulation source exists: it must preserve the research context and explain the next supported action.

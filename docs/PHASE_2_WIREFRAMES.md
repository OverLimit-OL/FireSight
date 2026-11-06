# Phase 2 interface wireframes

> Historical planning specification. The user explicitly lifted the timing gate on November 1, 2026. See the [implementation report](PHASE_2_IMPLEMENTATION_REPORT.md) and [actual client contract](PHASE_2_CLIENT_CONTRACT.md) for delivered scope and verification. Statements below about work not yet started describe the earlier planning stage.

Planning artifacts only. No new UI has been implemented. All names, revision/frame labels and panel contents below are schematic interface labels, not NASA measurements or simulated findings. Use the existing Fire-XII theme tokens and shell.

## Lab overview

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Existing sidebar     │ Lab                                  Demo · local only│
│                      ├───────────────────────────────────────────────────────┤
│ Research workspace   │ Scientific exploration              [New Experiment] │
│ Resources            │ Your experiments and data notebooks                   │
│ Lab                  │                                                       │
│ Settings             │ [Search saved work…] [Mode ▾] [Model ▾]               │
│                      │                                                       │
│ Research history     │ Recent work                                           │
│ Existing conversations│ Title →           Kind / mode    Model/version       │
│                      │ Saved experiment  Illustrative   Fixture catalog      │
│                      │ Dataset notebook  Data notebook  No model assigned    │
│                      │                                                       │
│                      │ Model capabilities                                    │
│                      │ Illustrative field sequence  [Inspect model]          │
│                      │ Scientific model catalog: no validated model connected │
│                      │                                                       │
│                      │ Continue from research                                │
│                      │ Browse source-linked investigations →                 │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Saved entries are normal links: open in one click and support new tabs. Group notebook/simulation kind visibly. Do not show fake completed-run counts or an engine-online indicator. Empty states point to New Experiment or the existing library. Real HTTP mode cannot substitute the illustrative catalog on failure.

## New Experiment — guided, bounded creation

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Existing shell       │ Lab / New Experiment                                 │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Choose a supported starting point                     │
│                      │ Model → Context → Configuration → Review              │
│                      │                                                       │
│                      │ Model family                                          │
│                      │ ( ) Available model with supplied evidence            │
│                      │ ( ) Illustrative field sequence                        │
│                      │     Illustrative / Not Scientifically Validated       │
│                      │                                                       │
│                      │ [Model information and limitations]                   │
│                      │ Output support: 2D slice / 3D samples / exact frames   │
│                      │                                                       │
│                      │ [Back]                                    [Next]      │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Each step has one clear task, named progress navigation and retained draft state. The final review shows model/version, input values and units, dataset revisions, provenance, applicability status and missing information. Create saves a configuration/session; it does not start computation automatically. Unsupported families appear as explanatory unavailable text rather than selectable fake options. With no available model, retain the research reference and offer the data notebook.

Starting from a study or saved session prepopulates only compatible references. Changing model versions asks the user to review supported inputs; it does not silently reinterpret old numerical values. Demo configuration offers fixture-sequence choices, not fabricated environmental variables.

## Wide studio — all regions when space permits

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Existing sidebar     │ Lab / Experiment                      [Save] [Fork]  │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Illustrative / Not Scientifically Validated           │
│                      │ Model + version · configuration revision · active run │
│                      │ [Run demonstration]  Job: queued/running/completed    │
│                      ├────────────────┬──────────────────────┬───────────────┤
│                      │ Configuration  │ Scientific viewport  │ Research      │
│                      │ Source study → │ [2D | 3D*] [Field ▾] │ [Selection]   │
│                      │ Model/version  │ [Slice ▾] [Reset view]│ [Model/evidence]│
│                      │                │                      │ [Copilot]     │
│                      │ Editable inputs│ Supplied samples /   │               │
│                      │ [Supported only]│ slice / geometry     │ Selected entity│
│                      │ Units + limits │                      │ Exact values  │
│                      │ Inline feedback│ Scientific axes      │ Units / origin│
│                      │                │ Missing-data marks   │ Source links →│
│                      │ [Defaults]     │ Labeled scalar legend│               │
│                      │ [Save revision]│                      │ Ask about this│
│                      ├────────────────┴──────────────────────┴───────────────┤
│                      │ Timeline: [Restart] [Prev] [Play/Pause] [Next] [Rate ▾]│
│                      │ Exact selected frame / supplied time or demo step    │
│                      │ [Frame-index scrubber + sourced event markers]       │
│                      │                                                      │
│                      │ [Variables | Measurements | Compare | Sample table]  │
│                      │ Source-aligned series + exact selected-frame marker   │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

`3D*` exists only when actual rank-3 output is available. The wireframe's blank stage is not an implied flame or computed field. The mode caption remains adjacent to the viewport. Select a sample through either the viewport or a named list/table; both lead to the same inspector.

Panel separators are resize controls with keyboard support; Collapse configuration and Collapse research are named buttons. The center must retain its minimum width. Header actions wrap before panel content becomes cramped.

## Standard laptop — attached panels, no squeeze

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Existing sidebar     │ Lab / Experiment           [Research panel] [Save]   │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Mode · model/version · revision · active run          │
│                      │ Dirty draft warning when inputs differ from results   │
│                      ├─────────────────────┬─────────────────────────────────┤
│                      │ Configuration       │ Viewport and analytical legend │
│                      │ Supported inputs    │                                 │
│                      │ [Save revision]     │ [2D/3D when supported]          │
│                      │                     │                                 │
│                      ├─────────────────────┴─────────────────────────────────┤
│                      │ Shared timeline and data                              │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Research opens as a titled sheet where docking would reduce the viewport below its minimum. This includes an ordinary 1440 px screen with the expanded Phase 1 sidebar when necessary. Reuse the existing Evidence Panel for source detail, rather than open several overlapping right sheets. Returning to the studio restores the selected frame and entity.

## Configuration changes and job status

```text
Results from saved revision N
Draft inputs have changed. These results belong to the earlier configuration.
[Show run inputs] [Discard draft] [Save new revision]

Job: Running                                  [Cancel computation*]
Playback: Paused                              [Resume playback]
```

Cancel computation is present only when supported. An accepted request reads Cancellation requested until an authoritative terminal status arrives. The playback controls never claim the backend job has paused. A failed job retains its configuration and error/retry action; old results remain labeled as the old run, not a fallback success for the failed one.

## Comparing two runs

```text
Compare [Run A ▾] with [Run B ▾]                     [Exit comparison]
┌─────────────────────────────────┬──────────────────────────────────┐
│ Mode / model / revision A       │ Mode / model / revision B        │
│ Inputs and provenance A         │ Inputs and provenance B          │
│ View A                          │ View B                           │
│ Exact selected frame A          │ Exact selected frame B           │
└─────────────────────────────────┴──────────────────────────────────┘
Time alignment: exact mapping available / unavailable
Overlay: supported compatible quantity / unavailable with reason
[Ask about this comparison]
```

If there is no explicit time correspondence, stepping A does not invent a corresponding frame in B. Show both selected coordinates independently. Recorded-versus-computed comparisons retain both origin labels. A difference curve or score requires a supplied result definition and provenance; no fabricated RMSE/confidence/validation verdict appears.

## Resource detail — supported preview

```text
Study title · original scientific source
[Overview] [Setup] [Variables] [Observations] [Interactive View] [Sources]

Interactive Experiment View
┌─────────────────────────────────────────────────────────────────────┐
│ Recorded Experiment / appropriate actual mode                       │
│ Recording/model + version · original source                         │
│                                                                     │
│ Shared scientific viewport, selected annotation and exact field     │
│                                                                     │
│ [Prev] [Play/Pause] [Next]   Selected frame/time   [Sample details]    │
└─────────────────────────────────────────────────────────────────────┘
[Open Full Lab] [Explore This Configuration] [Ask AI] [Compare Results]

Mapped observation → exact annotation and supporting source
Unmapped observation → explanation; no invented highlight
```

`?view=interactive` selects this section. Supported actions are derived from capabilities. Opening Full Lab preserves source/model/revision/run/frame/view/selection. Each annotation has a data mapping, not a hand-authored visual association inferred from study prose.

## Resource detail — currently relevant unavailable state

```text
Interactive Experiment View
┌─────────────────────────────────────────────────────────────────────┐
│ No reproducible interactive representation connected                │
│ The record links an investigation overview. Recorded frames,         │
│ spatial mappings and a supported model have not been supplied.      │
│                                                                     │
│ [Open data notebook] [Open original source] [Ask about limitations]  │
└─────────────────────────────────────────────────────────────────────┘
```

This is the expected treatment for the current five overview fixtures unless new source-backed material is supplied. A separate illustrative example may be offered outside this preview, with explicit opt-in and no claim to reconstruct the investigation.

## Mobile studio — one region at a time

```text
┌──────────────────────────────────┐
│ [Menu] Lab / Experiment [Actions] │
├──────────────────────────────────┤
│ Illustrative / Not Scientifically │
│ Validated                        │
│ Model/version · revision · run   │
│ [View] [Configure] [Data] [Research]│
├──────────────────────────────────┤
│ View controls / field selector   │
│                                  │
│ Faithful 2D view or supported 3D │
│ Semantic legend and selection    │
│                                  │
│ [Reset] [Zoom in] [Zoom out]      │
│ Exact selected frame / time      │
│ [Prev] [Play/Pause] [Next]        │
│ [Scrubber] [Direct frame select]  │
│ [Ask AI About This]              │
└──────────────────────────────────┘
```

At 320 px, controls wrap and panels become single-column content. Research opens Copilot/evidence in a titled accessible view; context is visible above the question. Sample tables scroll inside a named region. No floating panel covers time controls or the mobile keyboard. Automatic playback starts off and remains off under reduced-motion preferences.

## Reviewable AI proposal

```text
Review suggested change
Context: session · base revision · run · frame · evidence IDs

Current                            Proposed
View/input + unit                  View/input + unit

Source/limitations and applicability information
This will create a new draft if scientific inputs change.
[Cancel] [Apply reviewed suggestion]
```

Reject outdated proposals when their base no longer matches, and offer a fresh review. Applying a configuration suggestion does not submit a computation. Demo proposals are labeled scripted. Missing evidence remains visible, not replaced with a confidence badge.

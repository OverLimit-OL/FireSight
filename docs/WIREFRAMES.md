# FireSight interface wireframes

Low-fidelity planning artifacts, not application screenshots. Labels describe intended controls. No measurements, counts or conclusions here represent experiment results. Layouts use the Evidence notebook tokens in [DESIGN.md](../DESIGN.md).

## Desktop Home — composer leads

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ FireSight        [«] │ Research workspace                  Demo · local only │
│                      ├───────────────────────────────────────────────────────┤
│ [+ New research chat]│                                                       │
│                      │ Begin with a research question                        │
│ Home                 │ Scientific Intelligence for Space Fire Safety         │
│ Resources            │                                                       │
│ Lab                  │ Research question                                     │
│ Settings             │ ┌───────────────────────────────────────────────────┐ │
│                      │ │ What would you like to investigate?               │ │
│ Research history     │ │                                                   │ │
│ [Search history…   ] │ │ [Study context ×] [file.csv · staged ×]             │ │
│                      │ │ [Attach files]               [Send] Ctrl+Enter    │ │
│ No conversations yet│ └───────────────────────────────────────────────────┘ │
│                      │ Files stay on this device in demo mode.               │
│                      │                                                       │
│                      │ Suggested questions           Investigation index      │
│                      │ How can I trace a source? →   BASS →                  │
│                      │ What data can I compare?  →   FLEX →                  │
│                      │                               View all resources →    │
│                      │                                                       │
│                      │ Example index · measurements not connected            │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Composer stays near the top without a marketing hero. Selecting a question populates the editable input; it does not auto-send. Investigation rows are links, not KPI tiles. Recent local work replaces the empty activity area only when records exist. Collapsing the sidebar retains named tooltips and a visible expand action.

## Desktop conversation — claim to evidence

```text
┌──────────────────────┬────────────────────────────────────┬───────────────────┐
│ FireSight        [«] │ Research / Conversation            │ Evidence      [×] │
│ [+ New research chat]├────────────────────────────────────┤                   │
│ Home                 │ You                                │ Interpretation    │
│ Resources            │ How can I compare these studies?   │ Claim text        │
│ Lab                  │                                    │                   │
│ Settings             │ Scripted demonstration             │ Source title      │
│                      │ Comparison begins with documented  │ Investigation     │
│ Research history     │ metadata and compatible variables. │ Source type       │
│ [Search history…   ] │                                    │                   │
│ Comparison draft [⋯] │ [Interpretation · source details] ─┤ Passage/locator   │
│                      │                                    │ Provenance status │
│                      │ Referenced study →                 │ Uncertainty       │
│                      │ [Open in Lab]                      │                   │
│                      │                                    │ Open original ↗   │
│                      │                                    │ Open study →      │
│                      ├────────────────────────────────────┤                   │
│                      │ Research question                  │                   │
│                      │ [Multiline composer             ]  │                   │
│                      │ [Attach]                  [Send]   │                   │
└──────────────────────┴────────────────────────────────────┴───────────────────┘
```

Only dock this panel when the reading region retains its minimum width; otherwise it overlays as a modal sheet. For an unsourced example, the source region says No supporting source attached and omits fabricated source actions. A reading position is retained while the user inspects evidence. The composer can follow the document normally rather than create a second page scrollbar; a sticky enhancement must pass focus/keyboard checks.

## Library and study detail

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Persistent shell     │ Resources                           Demo · local only │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Research library                                      │
│                      │ [Search investigations…                            ] │
│                      │ [Investigation ▾] [Availability ▾]   Sort [Title ▾]   │
│                      │ Active filters… [Clear filters]                      │
│                      │                                                       │
│                      │ [ ] BASS — Burning and Suppression of Solids →        │
│                      │     Verified high-level objective                     │
│                      │     Source reference · measurements not connected     │
│                      │ ───────────────────────────────────────────────────── │
│                      │ [ ] FLEX — Flame Extinguishment Experiment →          │
│                      │     Verified high-level objective                     │
│                      │     Source reference · measurements not connected     │
│                      │                                                       │
│                      │ [Compare selected studies]                            │
└──────────────────────┴───────────────────────────────────────────────────────┘

┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Persistent shell     │ Resources / BASS                                      │
│                      ├───────────────────────────────────────────────────────┤
│                      │ BASS                                                  │
│                      │ Burning and Suppression of Solids                     │
│                      │ Source available · measurements not connected         │
│                      │ [Ask about this study] [Open in Lab] [Compare]         │
│                      │                                                       │
│                      │ Objective              │ On this page                │
│                      │ Attributed description │ Objective                   │
│                      │                        │ Conditions                  │
│                      │ Conditions             │ Measurements                │
│                      │ Not provided by the    │ Sources                     │
│                      │ connected source.      │                             │
│                      │                        │                             │
│                      │ Measurements / Findings / Files                       │
│                      │ Explicit unavailable states until sourced.            │
│                      │ Sources — original source link and provenance         │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Comparison opens a URL-addressable metadata view at `/resources?compare=id1,id2`; no extra mandatory route. A checked item remains selected through search changes. Detail section anchors are stable and scroll below the header. Sources precede related investigations in reading order.

## Lab — empty measurements, useful controls

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Persistent shell     │ Lab / Local workspace           [Save workspace]      │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Data and controls       │ Visualization               │
│                      │                         │                             │
│                      │ Study context: BASS     │ Select data to inspect      │
│                      │ Measurements unavailable│                             │
│                      │ Open source ↗           │ Study context saved.        │
│                      │                         │ No measurements connected.  │
│                      │ Dataset [Select…    ▾]  │                             │
│                      │ X [Requires dataset  ]  │ [Load synthetic example]    │
│                      │ Y [Requires dataset  ]  │                             │
│                      │                         │                             │
│                      │ [Reset view]            │                             │
│                      ├─────────────────────────┴─────────────────────────────┤
│                      │ Research notes                                        │
│                      │ [Editable notes, labeled as user-authored          ]  │
│                      │ [Ask about this view]     Saved on this device        │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Source context always survives unavailable measurements. Unavailable variable controls explain their prerequisites. Ask about this view works with study context alone and states that no numerical data is attached.

```text
After explicit synthetic-example selection:
┌───────────────────────────────────────────────────────────────────────────────┐
│ Synthetic demonstration · no physical interpretation                          │
│ Example signal versus sample index          [Line | Scatter | Table]         │
│                                                                               │
│   Chart stage: generated dimensionless traces, actual tick labels later       │
│   Series A — solid / circle      Series B – – dashed / square                 │
│   No NASA study name on chart, no confidence band or safety threshold          │
│                                                                               │
│ [Zoom in] [Zoom out] [Reset view]     Selected sample [Select sample…]          │
│ Accessible sample table: sample ID | index | series A | series B               │
└───────────────────────────────────────────────────────────────────────────────┘
```

The empty chart stage is intentional in this wireframe; plotting arbitrary traces now would look like scientific data. Final synthetic data generation and chart implementation wait until the event.

## Settings

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Persistent shell     │ Settings                                              │
│                      ├───────────────────────────────────────────────────────┤
│                      │ Workspace preferences                                 │
│                      │ Theme                 (System) (Light) (Dark)          │
│                      │ Density               (Comfortable) (Compact)         │
│                      │ Motion                (Follow system) (Reduce motion) │
│                      │ Citations             (Inline) (Expanded sources)     │
│                      │ Preferences apply immediately on this device.         │
│                      │                                                       │
│                      │ Conversation history                                  │
│                      │ Stored on this device, no server synchronization.     │
│                      │ [Delete local conversations…]                         │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

Destructive action opens a titled confirmation with affected count; confirm/cancel are explicit. No Save button for instantly persisted settings. Storage failure produces a clear persistent status instead of a false saved toast.

## Mobile — 390 px and 320 px reflow

```text
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ [Menu] FireSight       [Theme]    │  │ Evidence                    [×] │
│ Research workspace               │  │ Interpretation                   │
│ Demo · local only                │  │ Claim text                       │
├──────────────────────────────────┤  │                                  │
│ Begin with a research question   │  │ Source title                     │
│                                  │  │ Investigation / type             │
│ Research question                │  │                                  │
│ ┌──────────────────────────────┐ │  │ Supporting passage               │
│ │ Multiline question           │ │  │ Locator                          │
│ │                              │ │  │ Provenance status                │
│ │ [Study context ×]            │ │  │ Uncertainty not reported         │
│ │ [file.csv · staged ×]        │ │  │                                  │
│ │ [Attach files]       [Send]  │ │  │ Open original source ↗           │
│ └──────────────────────────────┘ │  │ Open related study →             │
│ Local staging explanation        │  │                                  │
│                                  │  │                                  │
│ Suggested questions              │  │                                  │
│ Investigation index              │  │                                  │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

Mobile Lab order: title/save → selected study/dataset controls → plot or unavailable state → table → notes → Ask about this view. The three regions are not narrow columns. Library rows stack metadata under titles; search/filter actions wrap. Detail navigation becomes a compact On this page disclosure. At 320 px, chips wrap, footer actions stack as needed, and chart table scroll remains within a named region.

The navigation drawer contains the same primary links, history search and history actions as desktop, with a title and Close navigation button. It traps focus while open, closes after route selection, and returns focus to Menu on cancel. Evidence and navigation do not remain open simultaneously; preserve selected evidence ID when transitioning.

## State and keyboard annotations

| State | Required visible treatment | Keyboard / assistive technology |
| --- | --- | --- |
| Fetch pending | Stable skeleton matching final geometry | Polite Loading resources status; no focus jump |
| Fetch failed | Explanation and Retry, preserved query | Retry button; error description linked |
| No matches | Active filters and Clear filters | Result-count announcement after search settles |
| Missing study/session | Named not-found state; recover to library/Lab | Route heading receives managed focus |
| Empty evidence | No supporting source attached | No empty source link |
| Send failed | Draft/context retained, Retry | Focus remains predictable; error announced once |
| Local storage unavailable | Working in memory; changes may be lost | Persistent status associated with Save |
| Comparison incompatible | Metadata remains; overlay reason stated | Table caption describes limitation |
| Dialog opened | Titled surface, explicit close/cancel | Trap, Escape, restore trigger focus |
| Chart inspection | Selected row and unit/source status | Sample selector/table offers equivalent access |

All action controls target at least 44 px on touch. Focus follows DOM reading order; no positive tabindex. On navigation, update document title and focus the page heading unless restoring browser history position. Do not use focus changes to announce every content update.

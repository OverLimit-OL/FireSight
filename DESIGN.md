# Fire-XII product and design specification

Original design specification · October 31, 2026. The user later changed the plan and authorized implementation as an independent prototype. The implemented identity follows Evidence notebook; see docs/IMPLEMENTATION_REPORT.md for verified behavior and deviations.

## Product thesis

A researcher should move from a question to an investigation, from an investigation to available data, and from a visualization back to the source without losing context. The core object is a traceable scientific claim, rather than a chat turn or a dashboard metric.

Primary audience: combustion researchers and aerospace engineers; secondary audience: university researchers and graduate students. The initial screen's job is to begin a question with an explicit research scope. Scientific content stays readable, source limitations stay visible, and the Lab never implies a validated simulator.

## Three visual directions

| Direction | Composition and typography | Scientific fit | Risk |
| --- | --- | --- | --- |
| Flight desk | Compact charcoal instrument panels; IBM Plex Sans and Mono; copper selection marks | Strong operational clarity, efficient comparisons | Can imply live telemetry and overemphasize density |
| Evidence notebook | Cool graphite shell, open reading surface; restrained Source Serif 4 for research titles, IBM Plex Sans for controls, Plex Mono for values; aligned source annotations | Best for reading, evidence tracing, and moving between narrative and data | Requires careful source alignment and mobile stacking |
| Optical bench | Pale neutral canvas; ruled plot stages and wide dataset tables; Source Sans 3 with Plex Mono | Best for large visualization workflows | Chat may feel secondary; plots can become decorative without data |

**Select Evidence notebook.** It reflects how researchers work through a publication and a notebook while retaining an analytical workspace. Its signature is the evidence margin: a short labeled claim marker in the reading column aligns with an expandable source record. The marker links to an actual evidence ID, never a decorative confidence gauge. This is the single expressive feature; surrounding controls stay quiet.

### Critique and revision before implementation

An early flight-desk concept leaned toward dark metric tiles and dashboard density. Remove the metrics entirely. Replace the home card grid with a scoped composer and two plain research lists. Use copper only for deliberate actions and selection, never status or scientific validity. Avoid parchment and terracotta editorial styling: the notebook refers to evidence structure, not a paper texture. Avoid uppercase instrument codes as section headings. No orbit illustration, simulated flame, activity pulse, gradients, or fictional collection totals.

The signature must survive an empty dataset: the investigator can still distinguish what is sourced, what is unavailable, and what to do next. The light theme is a full working environment, not an inverted screenshot.

## Information architecture

| Route | Main task | Context preserved |
| --- | --- | --- |
| `/` | Begin a research question; resume local work | Composer draft and staged context |
| `/chat/:conversationId` | Read, ask, inspect evidence | Message IDs, study IDs, lab snapshot |
| `/resources` | Find investigations and available data | Search, filters, sorting, comparison IDs in URL |
| `/resources/:studyId` | Read a study and its provenance | Section anchors; source/evidence IDs |
| `/lab` | Start or resume exploration | Explicit chosen study IDs; no implicit reset |
| `/lab/:sessionId` | Explore and save a workspace | Dataset IDs, variables, view, notes, selection |
| `/settings` | Manage meaningful local preferences | Theme, density, reduced motion, citations |
| `*` | Recover from an unknown destination | Display missing location; links home/library |

No login, account avatar, fake notifications, or nonfunctional profile menu. The compact header shows the section, contextual title and theme control. A persistent `Demo · local only` indicator describes actual mode; HTTP mode uses `API connected`, `Connecting…`, or `API unavailable` based on a real request, never a simulated green dot.

## Main journeys

1. **Question → evidence → source:** begin from Home, send a local example question, see `Scripted demonstration` on the response, activate a claim's Evidence button, then open the associated study section. Browser Back returns to the conversation and reading position.
2. **Library → contextual conversation:** find a study, choose Ask about this study, land on a new draft with a removable study chip. No question is submitted automatically. Sending creates the persisted conversation.
3. **Library → Lab:** choose Open in Lab; create a session containing the study ID even if measurements are unavailable. Show the source context and `No measurements connected`. Offer a separate, explicitly synthetic example; never attach invented NASA measurements to that study.
4. **Lab → question:** inspect a synthetic sample or a future real dataset, choose Ask about this view. Preserve an immutable view snapshot with dataset revision, variables, filters, units, and selected sample ID. Chat shows whether the snapshot is synthetic or sourced.
5. **Comparison:** choose up to three studies for metadata comparison. Measured-series comparison requires compatible quantity, units, environment and documented alignment. Otherwise explain why overlay is unavailable and retain metadata comparison.
6. **Resume:** rename a conversation, save a lab workspace, refresh, and recover those local records. Stage files again after refresh; never show them as uploaded.

## Design tokens

These are proposed sRGB values, to be mapped to semantic CSS variables at implementation. No isolated component-level theme overrides.

| Semantic role | Dark | Light | Use |
| --- | --- | --- | --- |
| background | `#151A1E` | `#F5F7F8` | Reading canvas |
| surface | `#1E252B` | `#FFFFFF` | Controls, overlays |
| surface-muted | `#252E35` | `#E9EEF1` | Selected row/background grouping |
| foreground | `#E9EEF2` | `#202A32` | Primary text |
| muted-foreground | `#AAB8C3` | `#52616D` | Secondary readable text |
| border-subtle | `#3B4852` | `#CFD8DF` | Nonessential separators only |
| control-border | `#81919F` | `#6A7985` | Identifiable input boundaries |
| primary | `#DFA77D` | `#824722` | Actions and selection |
| primary-foreground | `#151A1E` | `#FFFFFF` | Filled action text |
| evidence-link / focus | `#91C7EB` | `#195E86` | Source links, focus outline |
| destructive | `#F3A2A2` | `#A12535` | Destructive actions, labeled errors |

Scientific line colors: dark `#91C7EB`, `#DFA77D`, `#B6C7B3`; light `#195E86`, `#824722`, `#416344`. Pair each with line styles and point shapes. Observation, Interpretation and Prediction always have textual labels; source validity is never conveyed by color alone. Prediction is unavailable until supplied by an identified model with limitations.

Typography: self-host licensed font files later, with system fallbacks and `font-display: swap`. IBM Plex Sans for UI and body; Source Serif 4 for research titles and selected section headings only; IBM Plex Mono for numerical results, units and sample IDs. Body 16/26 px; compact body remains 16 px, controls 14/20 px; captions minimum 12/18 px; heading sizes 28/34, 22/28 and 18/24 px. Use tabular numerals for aligned values. Reading width 68 characters, no justified body text. Use real superscripts/subscripts or a formula renderer, not flattened scientific notation.

Spacing scale: 4, 8, 12, 16, 24, 32, 48 px. Control heights: 40 px desktop, 44 px touch; compact rows minimum 36 px with 24 px minimum targets and adequate spacing. Sidebar 256 px expanded, 72 px collapsed; header 56 px. Content maximum 1440 px, page gutter 32 px desktop, 24 px tablet, 16 px mobile. Chart stage minimum 320 px high on desktop; on narrow screens, use a readable data table without reducing text below 12 px.

Radii: 4 px for inputs, 6 px for grouped surfaces, 10 px for dialogs/composer; pills only for removable context and small classification labels. Borders 1 px; no double border around every nested section. Shadows only on floating overlays: dark `0 12px 32px #00000040`, light `0 12px 32px #15202B1A`. Main reading surfaces have no shadow.

Motion: 120 ms hover/color; 180 ms overlay opacity/transform. No layout animation for chat messages, no typewriter answer effect. Respect OS reduced motion; an in-app Reduce motion setting can additionally disable transitions but cannot override the OS preference to re-enable them.

## Responsive shell

- At 1280 px and above, sidebar is expanded by default. A 360 px evidence region can dock only while the main content retains at least 600 px; otherwise use a modal sheet. At 1440 px use narrower page gutters while docked if needed; no three-panel squeeze.
- At 1024–1279 px, optional collapsed sidebar; evidence opens as a sheet. Keep the user's desktop collapse preference without forcing mobile collapse into it.
- Below 1024 px, primary navigation becomes a titled modal drawer; header has a labeled menu button. Do not show a narrow icon rail on phones.
- Below 768 px, stack Lab controls, stage and notes in that order. Evidence is a full-height accessible sheet. Composer actions wrap; keyboard opening must leave input and Send reachable. Use dynamic viewport units and safe-area padding.
- Page scroll is the default. The desktop history area may scroll if necessary; mobile navigation and overlays contain their own scroll. Long code and scientific tables may scroll horizontally inside their regions, never the page.

## Page specifications

### Home and chat

Home starts with a modest title, `Begin with a research question`, immediately followed by the composer. Below it: suggested questions and investigation links as text rows; recent local activity only when it exists. Collection status reads `Example investigation index · measurements not connected`, without ingestion statistics.

The composer has an explicit label, multiline input, selected study/lab context, staged attachment chips, Attach files and Send. Ctrl/Cmd+Enter sends; Enter inserts a newline; do not send during IME composition. Empty submission produces an inline error and focuses the input. Trim surrounding whitespace for validation, preserve user formatting. Proposed limit: 12,000 characters; show a count near the limit. No auto-focus on mobile.

Proposed local staging constraints: PDF, CSV, TXT and JSON; maximum 5 files, 10 MiB each. Validate extension and reported type together, handling missing MIME values without claiming file-content validation. Duplicate selection reports the duplicate. Allow the same file to be selected again after removal. Object URLs, if used, are revoked on removal/unmount. Metadata is persisted only as `Reselect file`; file bytes stay in memory. Copy: `Staged on this device. File contents are not processed in demo mode.`

The conversation is a research document. User question has a small author label and subtle inset; assistant content occupies the open reading surface, with headings, paragraphs, lists and inline evidence markers. No large rounded assistant bubbles. The identity remains text-first. Explicit example response copy explains what the demo can demonstrate rather than suggesting a live model is interpreting files.

Message states: sending, scripted response pending, complete, failed and cancelled. Retry uses the original operation ID to avoid duplicates; cancellation stops the local timer or aborts HTTP and preserves draft/context. Never announce a cancelled server operation as definitely rolled back. If arrival occurs while scrolled up, expose Jump to latest and preserve position. Sanitize Markdown, disable raw HTML, accept only safe link protocols, and render formulas with untrusted-input safeguards.

History: separate primary navigation from the titled Research history region. Search by title; context menu supports Rename and Delete. Rename trims and validates 1–120 characters. Delete confirmation names the conversation, explains local removal and restores focus after cancel. After deleting the current conversation, route Home. New research chat preserves unrelated saved work; unsent draft lives under a distinct draft key.

### Evidence panel

Each claim marker names its classification and source count. Opening the panel reveals the claim first, then source title, experiment, source type, passage/measurement, locator and provenance. Separate reported passage from product-authored paraphrase. Quote only a short permitted excerpt; otherwise summarize with attribution.

Represent missing provenance as `Source provenance unavailable`, missing uncertainty as `Uncertainty not reported`, and missing evidence as `No supporting source attached`. Do not use an empty numeric confidence placeholder or infer certainty from citation count. A hypothetical prediction has model name/version, input scope and limitations or is explicitly unsupported. Never label demonstration prose as a verified observation.

Open original source navigates to a validated external URL. Open study navigates to `/resources/:id#section` only where the section exists. Missing studies leave source details readable and offer a library link. Docked panel is a labeled complementary region; narrow panel is a modal dialog with title, close button, focus trap, Escape and focus restoration. A marker is a button; the source destination is a link.

### Resources

Use a library list with title, investigation, concise objective, environment and data availability. Search and filters sit above the list; filters use only populated metadata. Start with investigation and availability, add objective/environment only when meaningful. No materials or measurement filters based on guessed values.

Search matches title, investigation and verified description. Sort by title by default; recent sorting appears only with documented publication dates. Search/filter/sort changes reset pagination. Loading uses aligned skeleton rows; empty results state which filters are active and offer Clear filters; errors retain the search and offer Retry.

Detail pages put source identity and data availability next to the title. Sections: Objective, Description, Conditions, Materials, Instruments, Measurements, Findings, Files, Sources, Related investigations. Unknown sections say `Not provided by the connected source`; no empty rows containing invented values. Findings require cited findings; generic descriptions are not findings. Files without an actual URL/ID show unavailable text, not disabled fake downloads.

Ask about this study and Open in Lab always retain study ID. Metadata Compare works for studies even without numerical series. Provide a remove action and a maximum-three explanation when full.

### Lab

Distinct layout: compact dataset controls, plot stage, observation/notes region. No chat composer in the plot stage. Default state says `Select data to inspect` and, for studies already selected, `Study context saved. No measurements connected.`

An optional `Load synthetic example` opens a confirmation describing the scope: generated unitless sample traces for interaction testing, unrelated to any NASA experiment. The persistent label is `Synthetic demonstration · no physical interpretation`. It survives screenshots, table view, saved session and chat transfer. Use sample index and dimensionless example signal, not temperature/oxygen/flammability values. No inferred safety bounds.

Controls are derived from actual variables. Line and scatter views appear only for compatible numeric axes; table view is always available. Missing values form gaps, never zeros; duplicate x-values retain sample IDs. Axis labels include units; unknown units are explicitly `unit not reported`. No smoothing, interpolation, normalization, unit conversion or dual y-axes without an explicit documented transform. Tooltips must be available through a keyboard-accessible sample table. Selection shows the exact row and source/illustrative status. Zoom has keyboard/button alternatives and Reset view.

Reset view affects axes/selection only. Reset workspace confirms removal of datasets, variables and notes. Save creates a local session or updates its revision; show Saved on this device only after persistence succeeds. On quota failure keep working in memory and show a clear recovery action. Notes are user-authored, never presented as NASA findings.

### Settings

Theme: System, Light, Dark. Density: Comfortable or Compact, with text size unchanged. Motion: Follow system or Reduce motion. Citations: Inline markers or Expanded source summaries, without hiding provenance limitations. History management: delete local conversations with count and confirmation. No language toggle before translations exist; architecture supports message keys and logical CSS properties for future Arabic. Clear history does not silently clear saved lab sessions or preferences.

## Shared component inventory

| Component | Responsibility and important states | Primitive plan |
| --- | --- | --- |
| AppShell / ResearchSidebar | Current route, collapse, searchable history, mobile navigation | Sidebar, Sheet, Tooltip, DropdownMenu |
| ContextHeader | Breadcrumb, true mode/status, theme | Breadcrumb, Button |
| ResearchComposer | Validated text, staged files, context, pending/error | Field, InputGroup, Textarea, Button, Attachment |
| ResearchMessage | Markdown, scientific blocks, source actions | Message; unboxed Bubble surface if supported |
| EvidenceMarker / EvidencePanel | Claim classification and source provenance | Button, Sheet, Badge, Alert |
| StudyList / StudyRow | Search results and metadata | Semantic list; Checkbox for comparison |
| StudyDetailSections | Anchorable metadata/source sections | Headings, description lists, Table |
| ComparisonView | Metadata first, compatibility explanation | Table, Dialog/route query state |
| DatasetPicker / VariablePicker | Actual available values only | Select/Combobox, Field |
| ScientificChart / SampleTable | Lazy chart, labeled data, equivalent table | Recharts wrapper, semantic Table |
| LabNotes / SaveStatus | Local note editing and save feedback | Field, Textarea, live status |
| ConfirmDelete / RenameDialog | Focus-safe destructive/edit flows | AlertDialog / Dialog |
| QueryState | Consistent loading/error/empty/retry | Skeleton, Alert, Empty |

Use the user-specified official shadcn/ui source as the registry. At implementation inspect actual CLI component availability and documentation first. Read generated source; modify semantic variants and tokens centrally. Do not assume newly documented chat primitives exist in the selected stable release. If absent, use documented accessible equivalents and record that limitation. Do not add every registry component or force Card wrappers around reading sections.

## Accessibility and content rules

Target WCAG 2.2 AA; verify rather than claim certification. One h1 per view, skip-to-main, native buttons/links, visible labels, named icon controls, focus rings not obscured by sticky surfaces. Announce sends, errors and saves politely; never make every streamed token a live announcement. All dialogs have titles, descriptions and focus restoration. Links have meaningful names and distinguish external destinations.

Minimum text contrast 4.5:1 (3:1 for qualifying large text), control/focus contrast 3:1. Proposed contrast pairs need measured review; separators are intentionally subtle and cannot be the sole control boundary. Support 200% zoom and 320 CSS px reflow. No pointer-only tooltips or gesture-only chart controls. Dates/numbers use Intl; preserve original precision and units rather than add digits. Bidirectional scientific IDs can use isolation; future locale text uses logical margins and padding.

Use sentence case throughout, following the brief and frontend-design skill; this intentionally takes precedence over the fetched web guidelines' title-case suggestion. Never use `NASA approved`, `AI verified`, invented ingestion dates, fake confidence percentages, or unsupported numerical findings.

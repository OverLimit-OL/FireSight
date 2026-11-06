# Frontend architecture plan

Original architecture plan, now used for implementation. The feature structure, typed adapters, local persistence and lazy route/chart loading exist under frontend/. Actual versions are locked in frontend/package-lock.json. Read docs/IMPLEMENTATION_REPORT.md for verified scope and remaining Flask decisions.

## Stack decisions

| Candidate | Decision and purpose |
| --- | --- |
| React + strict TypeScript + Vite | Standalone client; no SSR or Next.js requirement |
| Tailwind CSS + official shadcn/ui | Semantic tokens and owned accessible primitive source; custom FireSight variants |
| React Router | Browser routes, nested shell, URL state, not-found handling |
| Lucide React | Small consistent named icons; decorative icons hidden from assistive technology |
| Recharts | Lazy-loaded numeric line/scatter views; explicit table equivalent |
| TanStack Query | Shared async state/cache across chat, resources and Lab; avoid duplicating fetch effects |
| react-markdown + remark-gfm | Scientific narrative formatting without raw HTML; safe link handling |
| remark-math + rehype-katex / KaTeX | Formula rendering with trust disabled and bounded input; lazy-load only when needed |
| Vitest + Testing Library + user-event | Domain behavior and component interactions |
| Playwright | Real-browser flow verification and responsive screenshots; test files explicitly requested in the brief |
| axe-core integration | Automated accessibility checks plus required manual keyboard/contrast review |

Dependencies are proposed, not installed or version-verified. Use one package manager (npm unless an existing manifest later specifies otherwise), lock resolved stable compatible versions, inspect licenses and advisory output, and avoid automatic broad upgrades. Node v24.15.0, npm 11.12.1 and npx were observed in preflight; recheck later. The Vercel performance guidance's Next.js dynamic-import examples translate to React.lazy/Suspense in Vite; no Next dependency is needed.

## Proposed project boundaries

```text
frontend/
  src/
    app/                 router, providers, query client, mode configuration
    components/
      ui/                inspected shadcn primitive source and variants
      layout/            shell, sidebar, contextual header, mode indicator
      scientific/        units, provenance label, chart/table, source link
    features/
      chat/              drafts, composer, message view, history operations
      evidence/          markers, detail region/sheet
      resources/         search, detail, metadata comparison
      lab/               controls, view snapshots, local workspace notes
      settings/          preferences and explicit local data management
    services/
      api/               ResearchApi interface, HTTP adapter, errors/decoders
      mock/              deterministic fixtures, mock adapter, local repository
    types/               scientific models, transport DTOs, context payloads
    hooks/               only cross-feature reusable behavior
    lib/                 validated routes, formatting, storage version handling
    styles/              tokens, global semantics, typography
    tests/               integration utilities and domain tests
  e2e/                   acceptance flows after timing gate
```

Feature pages import service hooks and shared typed contracts, never another page component. Scientific types do not import React. No fixture literals in page components. Route boundaries load Resources, Lab and Settings lazily; Lab's chart code is separate from its empty state. Keep error boundaries around lazy routes and a shell-level recovery path. Avoid a global state framework until an actual need appears.

## Data and state ownership

| State | Owner | Persistence |
| --- | --- | --- |
| Server resources, conversations, sessions | ResearchApi + Query cache | Backend in HTTP mode; demo repository in mock mode |
| Search, filters, sort, selected comparison IDs | Router URL | Shareable query string |
| Evidence ID, chosen message | URL query `evidence` and `message` | Recover on reload if evidence exists |
| Draft text/context | Draft repository per route/draft ID | Versioned local storage in demo; never external by default |
| File bytes/object URLs | Composer staging registry | Memory only; reselect after reload |
| Theme, density, citation preference | Small preferences provider | `firesight:prefs:v1` |
| Desktop sidebar collapse | Shell preference | `firesight:shell:v1` |
| Open mobile drawer, tooltip, modal | Closest component | Ephemeral |
| Plot selected sample, view changes | Lab working state | Saved into LabSession on explicit save |
| Derived filters, selected study titles | Computed from source state | Never duplicate with effects |

Proposed demo keys: `firesight:demo:conversations:v1`, `firesight:demo:labs:v1`, `firesight:drafts:v1`. Do not store tokens or file contents. Parse and validate every stored record, catch security/quota errors, and show memory-only status on failure. Corrupt data is not silently replaced; offer a clearly scoped reset. Distinguish seeded examples from user conversations. Last-write revision conflicts should be surfaced between tabs using storage events; no silent note overwrite. In HTTP mode, local drafts/preferences remain local while backend records are not mirrored to local storage by default.

## API seam

One configured ResearchApi is injected at the provider boundary. Both adapters expose Promise-based operations with typed errors and optional AbortSignal. Research components consume the same hooks in both modes. Explicit `VITE_DATA_MODE=demo|http`; missing or invalid mode is a configuration error, never a fallback. Future README setup will explicitly select demo for local demonstration. `VITE_API_BASE_URL` is public configuration, not a secret. In HTTP mode an unreachable server displays an error and never triggers MockResearchApi.

Query keys include mode and parameters. Invalidate conversation summaries/detail after rename/send/delete; invalidate a session after save. Avoid serial resource fetches when IDs are already known. Default retries are limited to safe transient GET failures; do not automatically retry mutations without idempotency guarantees. Cancel obsolete searches; deduplicate requests; preserve prior results visibly while updating. Validate HTTP responses at the adapter boundary using focused runtime decoders or a justified schema library. TypeScript alone does not validate JSON.

The mock adapter supplies a deterministic script and fixed simulated delay (proposed 450 ms), with explicit QA-selected normal/empty/error states. It never inspects files, calls AI, or randomly succeeds/fails. Rejection scenarios must be visible through a demo-scenario selection, not secret prompt strings. Mock timing is a UI exercise, not a benchmark.

## Cross-page context protocol

Context is a serializable `ResearchContext` containing study IDs, dataset IDs and an optional immutable `LabViewSnapshot`. See API contract for field definitions. No File objects, component instances, functions or scientific arrays in router state.

- Resource → chat: navigate to `/?study=<id>`. Validate the ID, show a removable context chip, retain draft; no auto-submit. On send create the conversation and navigate to its returned ID.
- Resource/chat → Lab: create session through ResearchApi with all selected study IDs, then navigate to `/lab/<returned-id>`. Failed creation retains original context and exposes Retry.
- Chat → resource: normal link using a validated study ID and supported section anchor. Missing IDs render not-found rather than silently opening another study.
- Lab → chat: first save the working session/snapshot. Navigate to `/?lab=<session-id>&view=<snapshot-id>`. Resolve the immutable snapshot through the session response. If save fails, offer Retry and keep the user in Lab with working state intact.
- Evidence → resource: supported section ID is part of the evidence locator. Unknown section uses the source section, without inventing anchors.
- URL params take precedence over optional router state. Missing referenced data produces a visible context-unavailable chip with a remove/reselect action. Browser refresh never depends solely on history state.

Existing conversation context additions are explicit draft changes until send; they do not rewrite prior messages. A saved visualization snapshot preserves its synthetic/source label and dataset revision even if the underlying session later changes.

## Navigation and performance constraints

The future static host must rewrite non-asset application routes to index.html. API routes and nonexistent assets must not be rewritten to HTML. Verify refresh at every required route. React Router handles application not-found routes; resource/session not-found is distinct from server outage.

Use route-aware document titles, restore Back/Forward reading position, and do not steal focus on query-only updates. Debounce resource search if remote; announce the settled result count. Do not memoize trivial expressions or add effects for derived state. Keep history operations from re-rendering chart data. Virtualize only when an actual long list requires it, preserving keyboard/search behavior. Performance targets must be measured after implementation; no fabricated Lighthouse numbers.

## Rendering and scientific safeguards

Raw HTML from Markdown is disabled. External links use safe protocols; new tabs use appropriate rel attributes. Render math with trust disabled, escape unsupported input, and offer readable source when rendering fails. Cap document/file metadata lengths and display long names without page overflow.

Charts only plot dataset records whose variables and row schema validate. Preserve nulls, units, significant digits, origin, revision and uncertainty. A numerical value is never an evidence classification. Compatibility is a domain check with explicit reasons, not a disabled button with no explanation. User notes are separate from imported observations. No predictions or scientific transformations in the frontend.

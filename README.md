# Fire-XII

**Scientific Intelligence for Space Fire Safety** — an independent, evidence-first research workspace.

Fire-XII is a standalone React frontend with a fully local demonstration mode. It connects questions, NASA investigation overviews, source evidence and saved Lab workspaces. It is not an official NASA product or a validated combustion simulator.


## Phase 4 — Scientific workstation

The Lab now uses resizable configuration, viewport, research and analysis docks. Playback stays accessible without page scrolling. The refined schematic scene supports direct selection and contextual inspection; model-bound controls separate visualization settings from authored observations and unavailable scientific parameters. Copilot conversations remain explicitly simulated and retain context locally. Resource links can return to the same Lab session, run and frame.

- [Phase 4 design](docs/PHASE_4_DESIGN.md)
- [Implementation, verification and screenshots](docs/PHASE_4_IMPLEMENTATION_REPORT.md)

## Phase 3 — Virtual laboratory

The Lab now contains an interactive BASS-inspired schematic flow tunnel, selectable apparatus, a matching 2D section, synchronized authored flame poses, camera controls and visualization export. Guided setup and the BASS resource page share the scene. Contextual Copilot docks on desktop and opens in a drawer on smaller screens; its local replies remain explicitly scripted.

Existing saved experiments, revision/run identity, comparison, playback, chat history, evidence and settings are retained. Physical parameters, recorded NASA frames, reconstructed apparatus geometry, scientific computation and real AI remain unconnected. The scene is illustrative and is not a validated simulation.

- [Phase 3 design and scientific boundary](docs/PHASE_3_DESIGN.md)
- [Phase 3 implementation and verification](docs/PHASE_3_IMPLEMENTATION_REPORT.md)

## Phase 2 — Simulation Studio

 The Studio frontend now supports local experiment creation, immutable configuration revisions, fixture run lifecycles, 2D/3D inspection, timeline playback, comparison, forks and captured chat context. Scientific computation and real NASA recordings remain unconnected.

- [Implementation and QA report](docs/PHASE_2_IMPLEMENTATION_REPORT.md)
- [Implemented simulation client profile](docs/PHASE_2_CLIENT_CONTRACT.md)
- [Studio design and workflows](docs/PHASE_2_DESIGN.md)
- [Architecture, migration and technology research](docs/PHASE_2_ARCHITECTURE.md)
- [Desktop/mobile and Resource wireframes](docs/PHASE_2_WIREFRAMES.md)
- [Typed simulation API proposal](docs/PHASE_2_API_CONTRACT.md)
- [Execution gates and QA matrix](docs/PHASE_2_QA_AND_EXECUTION.md)

The original planning documents are retained as proposals. Current behavior, contract differences and verification are recorded in the implementation report; no competition eligibility or validated physics is claimed.

## Run locally

Requires Node.js 22.12+ or a compatible newer release; verified with Node 24.15.0 and npm 11.12.1.

```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. The development instance for this session is **http://localhost:5175**.

The checked-in `.env` explicitly selects `VITE_DATA_MODE=demo`. No Flask server, credentials, AI subscription, external fonts or file uploads are needed.

## Checks

Run from `frontend/`:

```bash
npm run typecheck       # strict TypeScript
npm run build           # typecheck and production bundle
npm run lint            # Oxlint
npm test                # Vitest + React Testing Library
npx playwright install chromium
npm run test:e2e        # real Chromium flows and responsive/a11y matrix
npm run preview         # serve the production bundle
```

Playwright uses port 5175 and starts Vite if an existing instance is unavailable. Use `TEST_BASE_URL` to test another deployment; configure the webServer setting when appropriate. Browser screenshots and reports are written to `frontend/output/playwright/`.

## What works locally

- Home, conversation, Resources/detail, Lab/session and Settings routes; invalid-route recovery.
- Persistent searchable conversation history, rename/delete, multiline composer, keyboard sending, cancel/retry and local attachment staging.
- Markdown, code and formula rendering; source-linked evidence with explicit missing provenance and uncertainty.
- URL-backed resource search, filters, sorting and metadata comparison.
- Study context transferred between Resources, Chat and Lab; immutable saved view snapshots transferred into new chat drafts.
- Existing synthetic line/scatter/table data notebooks, plus Simulation Studio at `/lab`, `/lab/new` and `/lab/studio/:simulationSessionId`.
- Saved/forked experiments, versioned configuration, async demo loads, exact 2D/3D samples, missing values, synchronized playback/traces, pinned comparison and contextual Copilot handoff.
- Light/dark/system themes, responsive navigation, density, reduced motion and citation preferences.
- Settings controls to exercise normal, empty and simulated-error demo states.

Demo responses are deterministic scripts, visibly labeled. Selected file bytes remain in memory and are never processed or transmitted. Reload requires reselection. Local conversation/session data is browser-origin-specific; a different port/browser has a separate notebook.

## Flask integration

Set `VITE_DATA_MODE=http` and `VITE_API_BASE_URL` to the backend **origin without `/api/v1`**, then restart Vite. Public Vite variables must not contain secrets. HttpResearchApi performs validated requests; it never substitutes mock results for API failures. File upload and real AI are intentionally not implemented. All backend endpoints remain proposed until agreed with the Flask team.

See [API_CONTRACT.md](API_CONTRACT.md) and [backend handoff](docs/BACKEND_INTEGRATION.md) for implemented-client details and remaining server decisions. A deployed SPA host must serve `index.html` for application routes while preserving API/asset 404 responses.

## Repository map

| Path | Purpose |
| --- | --- |
| `frontend/src/features/` | Chat, Resources, Lab, simulation, evidence and settings |
| `frontend/src/components/` | Customized shadcn primitives, shell, scientific visualization |
| `frontend/src/services/` | ResearchApi, HTTP adapter and local mock repository/fixtures |
| `frontend/src/types/` | Scientific types and Zod runtime schemas |
| `frontend/src/tests/`, `frontend/e2e/` | Domain/component tests and browser acceptance flows |
| [DESIGN.md](DESIGN.md) | Art direction, themes, tokens and interaction specification |
| [Wireframes](docs/WIREFRAMES.md) / [Architecture](docs/ARCHITECTURE.md) | Original planning and architectural decisions |
| [Sources](docs/SOURCES.md) | Source register and scientific/demo boundaries |
| [QA report](docs/IMPLEMENTATION_REPORT.md) | Verification, screenshots, skills and remaining limitations |

No backend, database, real AI service or numerical NASA dataset is included.

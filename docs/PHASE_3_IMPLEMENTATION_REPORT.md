# Phase 3 implementation and verification

November 1, 2026. Independent frontend prototype, following the Phase 2 implementation authorization and the explicit Phase 3 directive. No event eligibility is asserted. The repository's historical `AGENTS.md` remains unchanged.

## Delivered behavior

- Replace the Lab's primary matrix/point-cloud views with a reusable BASS-inspired schematic flow tunnel: enclosure frame, inlet/outlet grilles, mounted solid sample, sample support, observation camera, combustion envelope, floor grid, flow arrows and coordinate reference.
- Add a corresponding interactive orthographic section. Preserve exact synthetic samples in the secondary table, trace and comparison views.
- Select components by pointer or accessible object buttons; inspect role and limitations; highlight, orbit, zoom, reset and focus the camera. Aspect-aware fitting preserves the apparatus on narrow screens.
- Toggle annotations, apparatus and coordinate/flow guides; expand focus view; export PNG from 3D or SVG from 2D. Export names identify illustrative content.
- Drive discrete authored flame poses from the existing frame coordinate. The existing Timeline remains the only playback timer. Seeking, stepping, playback speed, current step and the chart use the same selected frame.
- Show the scene before any run is loaded. Setup previews do not constitute computed results. Run loading, cancellation and failure remain separate operations.
- Retain local saving, title/notes, revisions, run identity, comparison, forks and preset reset; allow restoring previous configurations into the current draft.
- Add a shared scene preview to guided experiment creation, independent/BASS research-context selection, and component preservation through creation.
- Add an explicitly illustrative companion to the BASS research record, including original NASA context, metadata and context-preserving Lab/Chat links. Unsupported resources retain their informative missing-data state.
- Dock Research Copilot at desktop widths; retain the accessible drawer on smaller screens. Show scripted contextual replies locally and capture the selected component in the existing typed simulation-context structure for Chat and return navigation.
- Preserve existing routes, research API adapters, settings, evidence, conversations and legacy data notebooks. No application dependency was added.

See [design decisions and source references](PHASE_3_DESIGN.md). The scientific context comes from the [NASA BASS-II record](https://ntrs.nasa.gov/citations/20160000593). Schematic geometry, camera placement and flame poses are frontend illustrations, not reconstructions or measurements.

## Verification

Commands run from `frontend/`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
TEST_BASE_URL=http://127.0.0.1:5176 npm run test:e2e -- --reporter=list --output=output/playwright/phase3-final-results
node output/playwright/phase3-visual-qa.mjs
```

The full production browser regression completed with **17 tests passed in 4.3 minutes**. Typechecking and linting passed. All 30 unit/component tests passed. Production bundling passed; Vite reports the existing Three.js renderer chunk above its 500 kB warning threshold (approximately 942 kB minified / 248 kB gzip). The renderer is lazy loaded. No renderer-size warning was hidden.

The dedicated visual audit covered Lab, setup and the BASS companion at 1440, 1280, 768 and 390px in dark/light themes: 24 states, no page overflow, no detected WCAG A/AA violations and no uncaught page errors. Results: [visual audit JSON](../frontend/output/playwright/phase3-visual-results.json). Automated accessibility checks do not replace manual assistive-technology testing.

Additional direct browser checks confirmed pointer selection on the 3D observation-camera mesh and nonoverlap of the compact camera toolbar and provenance caption at 1440px and 390px. The compact preview also passed an additional mobile accessibility and overflow audit.

Browser coverage includes immutable revisions and original-result identity, comparison, forking, local reopen, timeline/trace selection, playback, missing values, Copilot/Chat context, cancellation/failure recovery, unavailable/lost WebGL, themes, five-width accessibility checks, existing chat/evidence/attachment/settings flows, SVG export, component selection, Resource → Lab → Chat → Lab, and setup controls that must not submit the form.

During refinement, browser checks found and prompted fixes for disposed-canvas context-loss callbacks overwriting the current view, narrow setup previews, image-role nesting around focusable canvas content, incomplete SVG hit regions, accidental form submission by scene buttons and camera resetting on frame updates. Intermediate dev-server checks were also disrupted by hot-reload module invalidation during file edits; final regression uses the built production bundle.

## Visual evidence

- [Desktop Lab](../frontend/output/playwright/phase3-lab-dark-1440.png)
- [Final docked Copilot](../frontend/output/playwright/phase3-copilot-final-1440.png)
- [Final 2D section](../frontend/output/playwright/phase3-section-final-1440.png)
- [Final setup preview](../frontend/output/playwright/phase3-builder-final-1440.png)
- [Tablet](../frontend/output/playwright/phase3-lab-dark-768.png)
- [Mobile](../frontend/output/playwright/phase3-lab-light-390.png)
- [BASS companion](../frontend/output/playwright/phase3-resource-dark-1440.png)

## Integration boundaries

This release has no solver, real scientific LLM, calibrated sensor data, recorded NASA animation, reconstructed apparatus dimensions, physical-input controls, validated flame dynamics or quantitative mapping between scalar fixtures and schematic components. Playback coordinates are dimensionless steps, not physical time. The scene is composed from reusable React Three Fiber components; real geometry/field integration still requires an agreed backend payload and provenance contract. The existing HTTP adapter does not silently substitute demo results.

Development: `http://127.0.0.1:5175`. Production preview used for final verification: `http://127.0.0.1:5176`. Local data is origin-specific. Browser test contexts are isolated from the user's notebook. Frontend-design guidance informed the subject-specific instrument surface and typography; React guidance informed lazy renderer loading, stable camera-effect dependencies and component composition. Web Interface Guidelines informed keyboard alternatives, control labeling, visible focus and form behavior. Playwright and axe were used for interaction and accessibility checks. The CLI wrapper could not launch its default Chrome distribution, so the existing Playwright Chromium installation and repository browser tests were used.

No Git checkout is present, so `git diff --check` is unavailable; Markdown/link and whitespace checks are performed directly.

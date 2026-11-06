# Phase 4 — Implementation and verification

November 1, 2026. Focused frontend redesign of the existing FireSight application. The Phase 4 directive authorizes implementation of this independent prototype; no competition eligibility or validated science is claimed. The historical `AGENTS.md` remains unchanged.

## Architecture and interaction changes

`Studio` retains the existing React Query/session/revision/run APIs, immutable configuration identity and URL-backed selections. Its document layout is replaced by a bounded workstation. The application shell applies its viewport-height layout only to `/lab/studio/:id`; other routes keep their existing document behavior.

- `DockSplitter` provides pointer capture, keyboard arrows, Home/End, accessible separator values, bounded sizing and drag cleanup. Versioned local preferences retain dock sizes. Configuration and research collapse independently; the timeline remains accessible when analysis collapses. The existing primary navigation can collapse from the Lab toolbar.
- The desktop layout has a left setup dock, central viewport, right Inspector/Copilot/Evidence tabs and bottom Measurements/Comparison/Runs dock. Below 1100px, side docks become drawers with focus restoration. Desktop and drawer copies are not mounted together. Focus view contains keyboard navigation and supports Escape.
- `sceneSettings` and `modelParameters` define typed, model-version-bound controls. Visualization settings persist separately from scientific revisions. Baseline/alternative observation labels retain the existing reference/offset bundles internally. Engine-required and unsupported conditions expose explanations rather than fake physical inputs. Unknown versions do not inherit scientific parameter support.
- The shared renderer now has full, workstation and embedded variants. The Lab suppresses redundant object ribbons and verbose component descriptions in favor of the contextual Inspector. Resources retain a compact scene, selection metadata and full-Lab action without duplicating the Lab's docks.
- Scene components add rounded metal members, mounting feet/fasteners, an inset deck, support sleeves, optical lens rings, smoother envelope geometry and improved lighting, shadows and depth. Geometry and controls clean up on unmount; rendering remains demand-driven. Panel fitting preserves camera orientation while adjusting distance.
- Direct picking highlights the component, updates its annotation and opens Inspector. 2D/3D share selection and frame. Camera focus is explicit. Visualization controls affect only rendering; a browser check confirmed illumination changes retain run identity and saved scientific configuration.
- The existing Timeline remains the only playback timer. Chart selection updates frame and sample in one URL operation, fixing a previous overwrite race. Charts show exact values, selected cursors, discrete stems and selectable missing samples. Comparison aligns two authored runs by matching coordinate value/unit, without claiming physical time equivalence or NASA provenance.
- Copilot supports prepared questions and a locally persisted conversation with per-turn object, frame and run context. Free-text messages explicitly report the absence of inference. Continuing in Research Chat uses the existing typed snapshot, extended with optional comparison identity. Past message context remains attached to its original state.
- Study → new Lab preserves component and view. Lab → study → Lab preserves the existing session, run, frame, selection and view. Uncalibrated scalar selections are retained without fabricating apparatus locations.
- Existing chat history, API abstractions, resources, evidence, settings, local session saving, revisions, forks, cancellation/failure recovery and corrupt-draft recovery remain available.

No Flask service, NLP, LLM inference, combustion solver, application dependency or NASA dataset was added. See [design decisions and technical references](PHASE_4_DESIGN.md).

## Verification

Run from `frontend/`:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 5177 --strictPort
TEST_BASE_URL=http://127.0.0.1:5177 npm run test:e2e -- --reporter=list --output=output/playwright/phase4-final-results
node output/playwright/phase4-visual-qa.mjs
node output/playwright/phase4-comparison-qa.mjs
```

Strict typechecking and linting passed. All **32 unit/component tests** passed, including tests that engine controls cannot edit scientific inputs and unknown model versions cannot inherit scientific capabilities. The production build passed. The lazy Three.js renderer remains approximately 947 kB minified / 250 kB gzip; Vite's existing chunk-size warning remains visible.

The production regression completed with **20 tests passed in 5.2 minutes**. It includes the previous research/chat/evidence/settings/attachment flows, configuration revisions, immutable result identity, comparison, forks, source context, playback, WebGL fallback, focus behavior and responsive checks. Three new workstation scenarios cover resizable docks and persisted sizes, direct ray picking and linked chart state, local conversation persistence, idle rendering and repeated view cleanup. The final integration run passed **3 tests**, including unreadable-draft recovery, the existing-session research round trip and the Resource → Lab → Chat interaction. That gives **22 distinct passing browser scenarios** across the production regression and final integration runs; see their result directories below.

The visual/accessibility audit covered **36 states** across 1440×1000, 1280×800, 768×1024 and 390×844, in dark/light themes: workstation, 2D section, contextual Copilot, narrow-screen configuration drawers and BASS resource previews. It found **no horizontal overflow, no Lab page scrolling, no uncaught page errors and no detected WCAG A/AA violations** after refinement. Existing regression additionally checks 320px. A separate bounding-box check confirmed the run action remains within the 320px viewport. Final keyboard checks confirmed focus-view containment, Escape exit and focus restoration after closing either research or configuration drawer; focus-view accessibility had no detected violations.

A direct browser check confirmed visualization-only illumination changes preserve both run identity and saved configuration. The renderer test confirmed at most two animation-frame requests over an idle 500 ms sample after settling, one attached canvas after repeated 2D/3D switches, and successful recovery after forced WebGL context loss. These are browser checks, not a physical-GPU benchmark or exhaustive memory profiling. Automated accessibility checks do not replace manual assistive-technology testing.

Findings fixed during browser QA include missing accessible names on icon-only narrow-screen controls, keyboard access to overflowing Copilot history, independent chart URL updates overwriting frame selection, chart letterboxing in a shallow dock, duplicate hidden/mobile panel instances and view-state continuity. Existing failure-recovery tests were adapted to the new tabs and labels rather than discarded.

## Review artifacts

- [Before redesign, desktop](../frontend/output/playwright/phase4-before-1440.png)
- [Before redesign, mobile](../frontend/output/playwright/phase4-before-390.png)
- [Desktop workstation](../frontend/output/playwright/phase4-workstation-dark-1440.png)
- [Laptop workstation](../frontend/output/playwright/phase4-workstation-light-1280.png)
- [Mobile workstation](../frontend/output/playwright/phase4-workstation-dark-390.png)
- [Copilot drawer](../frontend/output/playwright/phase4-copilot-dark-390.png)
- [Orthographic section](../frontend/output/playwright/phase4-section-dark-1440.png)
- [Comparison with collapsed navigation](../frontend/output/playwright/phase4-comparison-1440.png)
- [Compact resource preview](../frontend/output/playwright/phase4-resource-dark-1440.png)
- [Machine-readable visual audit](../frontend/output/playwright/phase4-visual-results.json)
- [Production regression status](../frontend/output/playwright/phase4-final-results/.last-run.json)
- [Final integration status](../frontend/output/playwright/phase4-context-final-results/.last-run.json)
- [Build log](../frontend/output/playwright/phase4-build.log)
- [Pre-Phase-4 source and browser-test snapshot](../frontend/output/firesight-before-phase4.tar.gz)

Frontend-design guidance informed the instrument composition and information hierarchy. React guidance informed lazy loading, stable camera effects, reusable capability controls and geometry cleanup. Web Interface Guidelines informed accessible controls, keyboard alternatives, scroll-region focus and drawer behavior. Playwright/Chromium and axe provided browser validation. No new skill or application dependency was installed.

## Remaining backend dependencies

Real scientific work still requires agreed model-capability schemas, physical parameters, solver lifecycle endpoints, computed geometry/fields, calibrated apparatus coordinates, source-linked recordings and validation metadata. Real assistance requires an inference service implementing the typed context contract. This frontend does not estimate those missing values, map synthetic scalar samples onto physical sensors, or convert authored playback steps into seconds. The illustrative scene is not an exact BASS reconstruction and does not support safety predictions.

Development remains at `http://127.0.0.1:5175`; production QA used `http://127.0.0.1:5177`. Local storage is origin-specific. No Git checkout is present, so document links, fences and whitespace are checked directly instead of claiming `git diff --check`. The source snapshot contains the pre-redesign `frontend/src` and `frontend/e2e` paths for rollback.

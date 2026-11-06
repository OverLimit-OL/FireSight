# Simulation Studio implementation report

November 1, 2026. The user explicitly removed the timing restriction and authorized implementation. This records an independent prototype; competition eligibility is not asserted. `AGENTS.md` is preserved unchanged. Earlier planning documents remain design proposals; this report and the [implemented client profile](PHASE_2_CLIENT_CONTRACT.md) describe the delivered code.

## Delivered frontend

- `/lab`: saved experiments, capability status, model catalog and existing data notebooks.
- `/lab/new`: model/context selection, supported configuration and applicability review before creation.
- `/lab/studio/:simulationSessionId`: attached configuration panel, scientific viewport, timeline, sample trace, run history and research/Copilot sheet. Panels collapse instead of compressing the viewport.
- Existing `/lab/:sessionId` notebooks and their storage remain intact. `/lab?notebook=1` opens a blank notebook; old `?new=` links still work.
- Resource details contain a capability-aware Interactive Experiment View. All five current NASA overview records explicitly lack reconstruction data. Their references survive creating an illustrative experiment; the example is never described as a reconstruction.
- Save/rename/reopen experiments, author notes, restore defaults, create immutable configuration revisions, run/retry/cancel, pin an independent comparison and fork without inheriting output.
- Exact frame/entity selection shared by the 2D slice, 3D samples, numeric table, timeline and trace. Sparse frame IDs remain distinct from array indices; missing values remain null.
- Context capture before a run, while loading and after completion. Captured model version, configuration digest, run/frame identity and selected measurement survive chat creation and refresh. Chat links reopen that state. Demo replies and the reviewable visualization suggestion are scripted.
- A pending configuration cannot relabel old results. Run/frame identity checks stop inconsistent output from being rendered. Mutations use session versions; run submission uses an idempotency key retained across uncertain retries in the current page.

## Scientific boundary

The only local model is **Scalar field sequence v1.0.0**, persistently labeled **Illustrative / Not Scientifically Validated**. Two versioned JSON fixtures contain nine discrete steps and 27 xyz samples per frame. Coordinates, values and steps are arbitrary dimensionless examples. The center sample is missing at step 4. These bundles were authored offline and are replayed, not computed from physical conditions.

The sole run-affecting input selects reference or offset fixture data. There are no invented oxygen, fuel, gravity or flammability controls. No scientific confidence, safety conclusion, solver, ML inference or live AI service exists. Real NASA frames and validated models are not connected. A catalog validation flag alone never produces a validated-result label.

A comparison pins a second run's first frame with its original configuration. It does not align time bases, subtract fields or imply quantitative compatibility. Recorded-origin rendering is represented in the contracts; no recorded NASA playback is claimed to have been tested.

## Architecture and technology

Scientific schemas live in `frontend/src/types/simulation.ts`; React-independent adapters live in `src/services/simulation/`; fixtures live outside pages in `src/services/mock/simulation/`. Existing research schemas accept an optional nullable simulation context without rewriting older conversations. New state uses `firesight:simulation:v1` and separate versioned draft keys.

SVG handles the 2D slice and the small exact-sample trace. The trace resizes its coordinate system to retain readable mobile labels. Existing Recharts remains the data-notebook chart library. React Three Fiber 9.8.2 and Three.js 0.187.0 were added for genuinely rank-three illustrative point samples; `@types/three` supports strict checking. No Drei, physics library, vtk.js or Plotly dependency was needed.

The 3D renderer is lazy-loaded, uses on-demand rendering, fixed scalar coloring without lighting effects, capped DPR and disposable OrbitControls. DOM camera controls and the sample selector provide keyboard alternatives. WebGL errors/context loss preserve selection and lead back to 2D/table. This follows [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) and [Canvas fallback guidance](https://r3f.docs.pmnd.rs/api/canvas).

The 3D chunk remains approximately 939 kB minified (247 kB gzip), producing a Vite size warning; it loads only when 3D is selected. This is a measured bundle size, not a frame-rate or hardware benchmark. Large volume streaming, workers, SSE and validated applicability receipts remain future integration work.

## Skills applied

Existing installed skills used: frontend-design, vercel:react-best-practices, web-design-guidelines, shadcn, playwright, react-three-fiber; the previously researched threejs-webgl guidance informed resource ownership. No new skill was installed. Actions included reviewing the prior visual alternatives/tokens, preserving the Evidence notebook identity, shadcn CLI project/docs inspection, Field/overlay composition, lazy rendering, versioned storage, browser snapshots/screenshots, current Vercel accessibility review and focused React checks. Graphical animation examples were not treated as scientific models.

## Verification

See the final verification results appended below. Tests verify frontend behavior and identity handling; they do not validate physical science. Screenshots are local, generated artifacts under `frontend/output/playwright/`.

## Remaining backend decisions

The HTTP adapter is a bounded point-sample client profile, documented separately. Flask integration has not been exercised against a live server. Agree authentication, model applicability receipts, dataset bindings, canonical digest rules, asynchronous cancellation semantics, output retention, field encodings and size limits before admitting scientific models. General parameter editors and scientific validation labels need those contracts. The broader planning API is not an assertion that these server capabilities exist.

## Final verified results

- `npm run typecheck` and `npm run build`: passed. The final production bundle includes the lazy 3D renderer at 938.74 kB minified / 247.00 kB gzip; Vite reports its size warning.
- `npm run lint`: passed without warnings. `npx prettier --check src e2e *.ts *.json`: passed.
- `npm test`: **30 tests passed in three files**. Coverage includes immutable revisions, stale writes, forks, idempotency, cancellation races, missing samples, context preservation before/during/after runs, identity rejection, malformed HTTP and the existing research/composer behavior.
- Full browser regression: **14 tests passed**, including the original connected research journey, conversation lifecycle, attachment staging, navigation, themes, evidence and populated data notebooks. Runtime 4.5 minutes against Vite.
- Final production Studio suite: **four tests passed** against the built application at `http://localhost:4185`, including the new configuration-only Copilot and WebGL-disabled case. Runtime 57.1 seconds. These overlap the Studio tests in the full regression; they are not 18 distinct tests.
- New Studio/creation matrix: 1440, 1280, 768, 390 and 320 px in dark/light themes; 20 captured states with axe WCAG 2/2.1/2.2 A/AA checks and zero reported violations or page horizontal overflow. Existing 80 baseline/populated page states also passed their checks. Browser emulation and axe are not a complete WCAG conformance certification or physical-device/assistive-technology evaluation.
- Manually inspected generated desktop dark, narrow mobile light and 3D screenshots. Improved mobile slice framing and trace label sizing, rechecked in production. Playwright CLI navigation/snapshots also confirmed the overview and guided creation controls.
- `npm audit --omit=dev`: **zero vulnerabilities**. Full dependency audit retains 6 development-tool advisories (2 low, 4 moderate); no forced breaking tooling downgrade was applied.
- Documentation: ten index/handoff/Phase 2 files checked, eight JSON examples parsed, relative file links/fences/whitespace passed. `AGENTS.md` matches the pre-change archive byte-for-byte.

Screenshots: [desktop Studio](../frontend/output/playwright/studio-dark-1440.png), [narrow light Studio](../frontend/output/playwright/studio-light-320.png), [3D point view](../frontend/output/playwright/studio-3d-dark-1440.png), [experiment creation](../frontend/output/playwright/experiment-creation-light-390.png). Screenshots/traces/reports are generated locally and ignored by version control.

An expanded follow-up checked keyboard camera pan/reset, mobile 3D/table switching and the research sheet at 320 px (axe: zero violations). It exposed a context-loss listener timing gap after remounting 3D. Recovery now attaches during WebGL initialization with explicit renderer readiness. Rebuilt production, reran the two affected lifecycle/WebGL tests: **both passed (14.4 seconds)**. The final change is localized to the 3D lifecycle; baseline screen results above were not redundantly rerun. [Mobile 3D](../frontend/output/playwright/studio-3d-dark-320.png) and [mobile research inspector](../frontend/output/playwright/studio-inspector-dark-320.png) were captured.

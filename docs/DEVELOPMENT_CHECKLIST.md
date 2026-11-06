# Development gates and QA plan

Historical pre-event checklist. The user subsequently changed the plan and authorized an independent prototype. Implementation and browser QA now exist; the dated results in [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) supersede the original not-run labels below. Remaining Flask/model work is still outside the frontend scope.

## A — Preflight and timing

- [x] Inspect workspace and ancestor instructions: empty workspace, no applicable AGENTS.md found.
- [x] Read relevant installed design/React/accessibility skill instructions.
- [x] Review and install missing Playwright and shadcn skills for later work.
- [x] Produce planning deliverables only under the user's pre-event boundary.
- [ ] Recheck the selected event's official start date, local start time and timezone; record source and verification time before coding.
- [ ] Read any newly added repository instructions and preserve new files.
- [ ] Recheck current official challenge/FAQ content; do not assume planning artifacts are eligible submission material.

## B — Design specification

- [x] Compare three art directions and select Evidence notebook.
- [x] Define information architecture, user journeys, tokens, component inventory and mobile behavior.
- [x] Provide wireframes for Home/chat, evidence, Resources/detail, Lab and Settings.
- [x] Revise generic metric-card/home dashboard patterns out of the proposal.
- [x] Calculate proposed principal text, action, focus and control-border contrast pairs.
- [ ] During implementation render actual type, charts, states and both themes; refine from screenshots, not tokens alone.

## C — Foundation and shell, after timing gate

- [ ] Create `frontend/` with Vite React strict TypeScript; keep backend absent.
- [ ] Verify stable version compatibility and lock dependencies; record rationale and licenses.
- [ ] Create real scripts: dev, typecheck, build, lint, test, test:e2e. Run them before documenting success.
- [ ] Configure official shadcn registry, inspect CLI project info, fetch component docs and review generated source.
- [ ] Implement central semantic tokens and customized variants; add only used components.
- [ ] Implement all required routes, lazy boundaries, route titles, missing-route and missing-record states.
- [ ] Implement sidebar collapse persistence, search, mobile drawer, accessible header and skip link.
- [ ] Implement System/Light/Dark without first-paint theme flash; set color-scheme and theme-color.
- [ ] Verify deep-link refresh/rewrite behavior on the eventual host or representative preview server.

## D — Research workspace and evidence

- [ ] Build home overview with no invented metrics or decorative charts.
- [ ] Implement explicit demo mode and deterministic scripted response fixtures outside pages.
- [ ] Implement conversation create/open/rename/delete/search; confirm destructive actions.
- [ ] Persist draft/context; handle malformed/quota-blocked local storage visibly.
- [ ] Implement multiline composer, Ctrl/Cmd+Enter, IME protection and text validation.
- [ ] Stage supported files locally, validate limits, allow remove/reselect and label unprocessed status.
- [ ] Keep bytes in memory; after reload label attachments as needing reselection.
- [ ] Implement Markdown and safe formula/code rendering, with long-content overflow handling.
- [ ] Implement pending/error/retry/cancel without duplicate messages or fabricated progress steps.
- [ ] Implement claim classifications, reusable evidence panel, source locators and missing-provenance states.
- [ ] Verify evidence source actions, modal focus behavior and desktop dock-to-sheet transition.

## E — Research library

- [ ] Before creating fixtures, verify BASS, BASS-II, FLEX, SAME and Saffire descriptions against NASA sources; record source per record.
- [ ] Treat unverified metadata as unavailable; do not infer findings from objectives.
- [ ] Implement URL-backed search, supported filters, stable sorting and clear/reset.
- [ ] Implement loading/empty/error/not-found and retry with preserved state.
- [ ] Implement detail sections, actual source links and explicit missing measurements/files.
- [ ] Implement metadata comparison and compatibility reasons for unavailable quantitative overlays.
- [ ] Implement Ask about this study draft context and Open in Lab with study IDs preserved.

## F — Lab

- [ ] Start with honest unavailable-data state and saved study context.
- [ ] Add synthetic example only after explicit selection, clearly separated from NASA data.
- [ ] Store synthetic origin in dataset, saved view, table, chat context and screenshot-visible caption.
- [ ] Select dataset/variables, line/scatter/table, sample inspection and zoom/reset with keyboard alternatives.
- [ ] Handle nulls, duplicate x-values, missing units, incompatible variables and unloaded pages correctly.
- [ ] Implement local notes, save/reopen sessions and revision conflict feedback.
- [ ] Create immutable view snapshots before Lab-to-chat navigation; preserve context if save fails.
- [ ] Keep prediction/model controls unavailable until real backend capabilities exist.

## G — Integration and settings

- [ ] Add ResearchApi interface, MockResearchApi, HttpResearchApi and validated transport decoding.
- [ ] Isolate data modes; HTTP network failure must never produce scripted demo output.
- [ ] Persist theme, density, motion and citation preferences; keep preferences meaningful.
- [ ] Implement local history deletion with confirmation and accurate partial-failure handling.
- [ ] Centralize copy keys, Intl formatting and logical CSS properties for future RTL; no unimplemented language switch.
- [ ] Complete every cross-page path in the acceptance matrix below.

## H — Automated and browser QA

Automated tests should exercise observable behavior and domain invariants, not mirror component internals. All rows below are **not run**.

| Test group | Required cases | Verification |
| --- | --- | --- |
| Contract boundary | Unknown IDs, null fields, bad JSON/envelope, 204, 422 field errors, 409 conflicts, abort | Vitest adapter tests with controlled responses |
| Scientific integrity | Missing provenance/uncertainty, no invented scores, null not zero, synthetic origin retained | Domain tests and rendered assertions |
| Conversation lifecycle | Create, send, open, rename validation, confirm/cancel delete, search, refresh | Testing Library and Playwright |
| Composer | Multiline, shortcut, IME, whitespace, limits, local files, duplicate/remove/reselect, error/retry | Component tests and real file chooser flow |
| Library | Search/filter/sort URL, clear/no results/retry, detail missing fields | Component and browser flows |
| Lab | Empty/source context, synthetic opt-in, variable selection, point/table inspection, save/reload/reset | Component and browser flows |
| Context | Resource→chat, resource→Lab, chat→resource, chat→Lab, Lab→chat, evidence→resource | Playwright full journeys with refresh between steps |
| Persistence | Preferences, collapsed sidebar, sessions, drafts, blocked/quota/corrupt storage | Controlled storage tests and reload checks |
| Navigation | Every direct route, invalid route/ID, Back/Forward, host refresh | Preview/host browser checks |
| Accessibility | Names, labels, focus trap/restore, skip link, contrast, keyboard charts, announcements | axe plus manual keyboard/screen-reader spot check |
| Safety of rendering | Raw HTML, unsafe link protocols, formula fallback, long filenames/IDs | Focused render tests and browser inspection |
| Mode separation | Demo banner, scripted response label, no network for staged files, HTTP down | Browser request assertions and adapter tests |

### Viewport and theme review

At each width review Home, a long conversation, open evidence, Resources, detail, empty and synthetic Lab, and Settings. Capture both themes; system theme also needs live OS preference-change testing. This is a future capture list, not an assertion that images exist.

| Width | Representative height | Primary risks | Status |
| --- | --- | --- | --- |
| 1440 | 900 | Evidence docking, reading width, sparse/overcrowded regions | Not run |
| 1280 | 800 | Sidebar, chart labels, sheet behavior | Not run |
| 768 | 1024 | Tablet navigation, controls wrapping, stacked Lab | Not run |
| 390 | 844 | Drawer/focus, mobile keyboard, composer/file chips | Not run |
| 320 | 740 | Reflow, long IDs, touch targets, local table scroll | Not run |

Also test 200% zoom, reduced motion, keyboard-only use, long study titles and very long Markdown/code. Touch keyboard behavior needs a real device or suitable device testing and must be reported separately from viewport emulation.

Use the installed Playwright skill workflow: open page, snapshot, act on fresh refs, re-snapshot after significant changes, capture screenshot/trace. The user explicitly requested automated tests, so Playwright test files are appropriate in addition to CLI visual inspection. Store browser evidence under `frontend/output/playwright/` with route/state/theme/viewport names. Review screenshots visually, fix issues, then rerun affected checks; a successful screenshot command alone is not visual QA.

### Final gates

- [ ] Strict typecheck, production build, relevant automated tests and lint pass.
- [ ] No unexpected console errors, unresolved requests, page-wide horizontal overflow or duplicate mutation effects.
- [ ] Measured contrast and actual focus states meet targets in both themes.
- [ ] Route refresh and Back/Forward preserve meaningful context.
- [ ] Every visible action works, communicates a prerequisite, or is removed.
- [ ] Scientific traceability, missing-data copy and synthetic labeling survive all journeys.
- [ ] Final screenshots show a recognizable scientific workspace rather than generic dashboard tiles.
- [ ] Update README with verified commands, dependency versions, mode behavior and integration instructions.
- [ ] Publish a QA report with commands, actual results, screenshot paths, remaining limitations and scope of verification.

## Acceptance traceability

| Requirement | Planned owner | Proof required after implementation |
| --- | --- | --- |
| Four primary sections and all routes | Shell/router | Direct navigation + refresh matrix |
| Conversation history and composer | Chat feature/mock repository | Lifecycle and attachment tests |
| First-class evidence | Evidence feature | Claim→panel→source journey, missing-source test |
| Searchable library/detail | Resources feature | Query/filter/deep-link tests |
| Meaningful honest Lab | Lab feature | Selection/inspection/save + synthetic label checks |
| Connected research workflow | Typed context protocol | All six directional journeys |
| Persistent settings | Preferences provider | Reload + system theme change |
| Separate Flask API seam | ResearchApi adapters | Same component flows against mock/controlled HTTP |
| Maintainability | Feature boundaries | Review imports, strict types, no inline fixture responses |
| Mobile and accessibility | Shared primitives/layout | Five widths, both themes, keyboard/manual review |

No full acceptance item is marked complete before its required implementation evidence exists.

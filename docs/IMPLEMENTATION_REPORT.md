# Fire-XII implementation and QA report

October 31, 2026 · independent frontend prototype, implemented after the user changed the original pre-event plan. The original planning documents remain available. AGENTS.md was preserved; its earlier planning-only description is historical, and the user's later authorization controls this implementation.

## Delivered behavior

The standalone React application lives in `frontend/`. Research workspace, conversations, Resources/detail, Lab/session and Settings routes are implemented, including missing-route/record states. The dark/light Evidence notebook identity uses self-hosted IBM Plex and Source Serif typography, restrained copper actions and source-linked reading surfaces. Mobile navigation is a titled, focus-managed drawer.

Conversations support create, open, search, rename and confirmed deletion. The composer supports multiline input, Ctrl/Cmd+Enter with IME protection, staged PDF/CSV/TXT/JSON attachments, limits, remove/reselect, pending/cancel/retry and persistent drafts. Responses are deterministic scripts visibly labeled as demonstrations. Markdown, code and mathematical notation render without executing raw HTML; remote Markdown images are not fetched.

Evidence panels distinguish classifications, attributed paraphrases, source identity, provenance limitations and unavailable uncertainty. No confidence scores or NASA numerical findings are invented. Source actions connect to investigation detail sections and original NASA references.

Resources use URL-backed search, filters, sorting and up-to-three metadata comparison. Study context flows into chat and Lab. The Lab preserves context without measurements, offers an explicit synthetic-example opt-in, renders line/scatter/table views, supports point inspection and zoom/reset, and persists notes/workspaces. Lab-to-chat transfers an immutable view snapshot with dataset revision, units, selected sample and synthetic/source identity.

Settings persist themes, density, reduced motion and citation presentation. Separate demo scenarios exercise empty/error states. Runtime schemas validate storage and HTTP data; optimistic revisions detect stale writes, and duplicate-send protection prevents repeated local commits.

## Verification

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed through the production build |
| Production build | Passed with Vite 8.3.5 |
| Oxlint | Passed, no warnings |
| Prettier source/config check | Passed |
| Vitest / Testing Library | 16 tests passed across 2 files |
| Production Chromium suite | 11 tests passed against the production preview (2.5 minutes) |
| Production dependency audit | Zero vulnerabilities (`npm audit --omit=dev`) |
| Document links and whitespace | Passed across 11 documentation files |

The production browser command is `TEST_BASE_URL=http://localhost:4175 npm run test:e2e`, served by `npm run preview -- --host 0.0.0.0 --port 4175 --strictPort`. Development is also available on port 5175. No external deployment or real Flask server was used.

The browser suite covers the complete Resources → Chat → Evidence → Resources → Lab → Chat path, refresh/reopen, conversation rename/delete/search, keyboard send, staged attachment reselection without uploads, sidebar/theme persistence, error/empty recovery, invalid routes, browser Back and mobile drawer focus restoration.

The screenshot/a11y matrix covers 1440, 1280, 768, 390 and 320 px in both themes. Its 80 combinations comprise five baseline pages plus populated chat, evidence and Lab states. Automated axe checks target WCAG 2 A/AA, 2.1 AA and 2.2 AA rules. This is automated inspection with manual screenshot review, not a WCAG certification or physical-device test.

## Browser evidence

Screenshots and the HTML report are generated under `frontend/output/playwright/` (ignored by Git but present in this workspace).

- [Desktop Home](../frontend/output/playwright/home-dark-1440.png)
- [Light mobile Home](../frontend/output/playwright/home-light-390.png)
- [Research library](../frontend/output/playwright/resources-dark-1440.png)
- [Metadata comparison](../frontend/output/playwright/comparison-dark-1440.png)
- [Research conversation](../frontend/output/playwright/chat-dark-1440.png)
- [Mobile evidence](../frontend/output/playwright/evidence-light-390.png)
- [Populated Lab](../frontend/output/playwright/lab-populated-dark-1440.png)
- [Mobile Lab](../frontend/output/playwright/lab-populated-dark-390.png)
- [Narrow mobile settings](../frontend/output/playwright/settings-dark-320.png)
- [HTML test report](../frontend/output/playwright/report/index.html)

Visual review corrected a scatter-axis mapping that initially rendered no points. The tests now assert rendered scatter symbols and line paths. It also corrected evidence focus restoration, premature screenshots of lazy loading states, a nonfunctional table-mode toggle and undersized numerical values. A subsequent focused review tightened scatter-point selection to use its immutable sample ID (rather than a filtered array index) and made attachment reselection updates immutable. The affected research and attachment journeys were rerun against the rebuilt production bundle. Early exploratory failures are not counted as passing verification; final results are listed above.

## Architecture and dependency choices

React 19.3.1, TypeScript 7.0.2 and Vite 8.3.5 provide the separate client application. Tailwind 4.3.3 and inspected Radix-based shadcn source provide customizable primitives. React Router 7.18.5 owns navigation; TanStack Query 5.105.0 owns async cache state. Recharts 3.10.1 is lazy-loaded only for numerical plots. Zod 4.6.7 validates transport/storage records. Markdown/GFM/math packages provide scientific narrative formatting; KaTeX trust is disabled and expansion/size are bounded.

The pure scientific types do not depend on React. API operations are centralized through ResearchApi and its MockResearchApi/HttpResearchApi implementations. Draft persistence reports storage status through an external-store hook, avoiding an additional React render on every successful keystroke save. Lab controls and visualization stages are separate modules. Preference/context state remains small; no general state-management framework was added.

Fontsource packages contain self-hosted, OFL-licensed fonts. Unused Vite starter imagery was removed. The actual dependency versions and transitive tree are locked in `frontend/package-lock.json`. The production chart chunk is approximately 110 kB gzipped and loads on demand; this is a bundle measurement, not an LCP or responsiveness benchmark.

## Skills actually used

| Skill | Application |
| --- | --- |
| frontend-design | Existing compatible installed skill; three directions, tokens, evidence-margin signature, typography and screenshot critique. Not claimed identical to current Anthropic upstream. |
| vercel:react-best-practices | Feature boundaries, lazy routes/charts, versioned local persistence, derived state and rendering review. |
| web-design-guidelines | Fetched current Vercel rules; reviewed labels, focus, form feedback, themes, URL state, reduced motion, tables and responsive overflow. |
| shadcn | Installed/reviewed official skill; used CLI info/docs/search/view/add, inspected generated components, customized semantic tokens/variants and integrated message/bubble/attachment/scroller primitives. |
| playwright | Installed/reviewed OpenAI skill; checked npx, used CLI snapshots/screenshots and real Chromium tests with semantic locators, traces and viewport captures. Automated test files were explicitly requested. |
| skill-installer | Installed missing shadcn and Playwright skills without replacing existing compatible skills. |

The current web-interface review follows sentence-case product copy as specified in the brief rather than its generic title-case suggestion. Mixed variant/hook exports in inspected shadcn source are explicitly exempted from the Fast Refresh export warning; other React/TypeScript lint checks remain enabled.

## Scientific and integration boundaries

All five investigation entries are high-level source-linked overviews. No numerical NASA dataset is connected. The synthetic example has 24 generated, dimensionless samples with one explicit missing value, no NASA study ID and no scientific prediction. See [SOURCES.md](SOURCES.md) for the source register and demo scope.

Attachment bytes remain in memory, never uploaded or interpreted. Saved attachment metadata requires reselection after reload. Files are limited to five at a time, 10 MiB each. HttpResearchApi rejects local staged attachments rather than pretending an upload succeeded.

Local conversations, Lab sessions, drafts and preferences are browser-origin-specific. Files do not survive refresh. Blocked/full/corrupt storage produces recovery feedback; persistence is not represented as successful when it fails.

Flask integration is proposed and tested only against controlled HTTP responses. No backend routes, database, authentication, file service, LLM or validated physical model is included. The implemented Markdown message transport differs from the original proposed heterogeneous blocks; [API_CONTRACT.md](../API_CONTRACT.md) documents the current shape and unconfirmed server decisions. HTTP outages never trigger a demo fallback.

Remaining limitations: English only; no completed Arabic translation/RTL regression; no Safari/Firefox or physical touch-keyboard validation; no independent screen-reader certification; no deployed-host rewrite validation or hardware performance benchmark. A static production host must configure application-route rewrites independently.

The development/code-generation dependency tree retains six npm advisories (two low, four moderate) through shadcn's deepmerge/ts-morph/minimatch dependencies. A compatible audit fix did not resolve them; the suggested forced change would downgrade the CLI across major versions. No forced downgrade was applied. Production dependency audit is clean; KaTeX transitive versions are aligned to the installed 0.19.1 version through an npm override, and formula rendering is covered by the browser journey.

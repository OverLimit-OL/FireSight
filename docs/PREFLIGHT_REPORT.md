# Preflight and planning review

Historical preflight recorded October 31, 2026, before the user changed the plan and authorized implementation. This report describes the earlier planning-only state; consult [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md) for current code and QA results.

## Repository and execution boundary

- Workspace `/home/abdulrahman/Desktop/Fire` was empty at inspection, including no package manifest or source files. No applicable AGENTS.md was found in the workspace or inspected ancestor locations.
- No prior FireSight memory match was found; no historical project facts were used.
- Node v24.15.0, npm 11.12.1 and npx were observed. No application dependencies were installed, and no application, backend, AI integration or runnable prototype was created.
- The user's supplied November 14–15 event dates are later than October 31. Implementation remains deferred. Exact permitted local start time was not established; it must be checked for the chosen event before beginning code.

## Source verification and limits

| Source | What was available | How it is used |
| --- | --- | --- |
| [Official challenge](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/) | Search-index excerpt; direct fetch returned 502/timeout | Challenge identity only; full instructions not claimed verified |
| [Official participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/) | Direct fetch failed with 502 | Listed for later verification; no inferred exact start time |
| [Official Santiago event listing](https://www.spaceappschallenge.org/2026/local-events/santiago-dominican-republic/) | Search-index excerpt says development must occur during November 14–15; direct fetch failed | Corroborates timing boundary, does not define this team's local start |
| [Canadian Space Agency event notice](https://www.csa-asc.gc.ca/eng/events/2026/2026-11-14-space-apps-challenge.asp) | Search-index excerpt names November 14–15; direct fetch timed out | Date corroboration, not proof of local start hour |
| [NASA Glenn combustion science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/) | Page content fetched, search excerpt available for BASS and FLEX | Source for names/high-level context only; no experiment measurements imported |
| [Vercel web interface guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) | Current guideline text fetched | Accessibility, focus, forms, theme, URL state and QA review requirements |

All sources consulted on October 31. Live/indexed website text can change and a search excerpt is weaker evidence than complete content. The user's no-implementation instruction is sufficient to enforce the boundary regardless of website availability. These planning artifacts are not a claim of organizer approval or submission eligibility.

## Skills discovered, read and applied

| Skill | Source/status | Actual use in this turn |
| --- | --- | --- |
| frontend-design | Existing compatible skill at `/home/abdulrahman/.agents/skills/frontend-design/SKILL.md`; not asserted identical to current Anthropic upstream | Subject-led design, three directions, named type roles/tokens, ASCII layout ideation, one signature feature, critique and revision |
| Vercel react-best-practices | Existing plugin skill at `/home/abdulrahman/.codex/plugins/cache/openai-curated-remote/vercel/0.54.1/skills/react-best-practices/SKILL.md` | Architecture: dynamic loading, schema-versioned local persistence, calculated derived state; read corresponding rule files |
| web-design-guidelines | Existing `/home/abdulrahman/.codex/skills/web-design-guidelines/SKILL.md` | Fetched current source, reviewed specified design/wireframe documents against relevant rules; no UI code exists to audit |
| skill-installer | Existing system skill, full instructions read | Used its documented installer for the two missing skills |
| shadcn | Installed from `shadcn-ui/ui`, path `skills/shadcn`, into `/home/abdulrahman/.codex/skills/shadcn` | Read full instructions; mapped official primitives, semantic theming and composition constraints into inventory and implementation checklist. No component CLI/init/add was run |
| playwright | Installed from `openai/skills`, path `skills/.curated/playwright`, into `/home/abdulrahman/.codex/skills/playwright` | Read instructions, checked npx prerequisite, incorporated snapshot→interaction→capture workflow in QA plan. No browser tests run |

The newly installed skills will be available for discovery on the next turn. Reading them here supports the plan; installation is not evidence of successful browser/component implementation. Existing compatible design/React skills were retained rather than overwritten.

Security review before installation: inspected upstream skill instructions and directory inventories, and reviewed the Playwright wrapper (it forwards arguments to npx Playwright CLI). Both skills request developer/browser tooling; no instruction to disclose secrets or transmit project contents was accepted. Installed instruction/helper files using the trusted local installer. Did not execute downloaded helper scripts, shadcn CLI, package lifecycle scripts or third-party project-generation commands. This is an instruction/entrypoint review, not a comprehensive audit of every bundled file or npm dependency.

Installed SKILL.md SHA-256 fingerprints:

```text
playwright  0ffaabcc8e0990627c4725f18bf1c7955534a796c1c199e872909de2013ce6a8
shadcn      93951e5e83f616a3e046491c00d770bd54c0a64164706cd1191822a233d27592
```

## Planning review and resolved findings

This is a specification review using the web-interface rules, not a WCAG conformance or visual QA result.

- `DESIGN.md`: replaced generic metric-tile proposal with a scoped composer and plain research lists; tied the evidence margin to actual claim/source IDs.
- `DESIGN.md`: separated subtle decorative separators from identifiable control borders. Added semantic contrast requirements, explicit labels, focus restoration, safe-area behavior and chart table alternatives.
- `docs/ARCHITECTURE.md`: replaced route-state-only handoff with URL IDs and saved immutable snapshots, so refresh does not silently discard scientific context.
- `API_CONTRACT.md`: added dataset retrieval, source/null invariants, incomplete-row handling, revision conflicts and idempotency proposals; marked all endpoints unconfirmed.
- `docs/WIREFRAMES.md`: defined 320 px stacking and evidence/navigation exclusivity to avoid overlapping sheets and crushed main content.

Sentence-case product copy intentionally follows the brief/frontend-design preference over the fetched guidelines' title-case suggestion. User scope also overrides the shadcn skill's broad scaffold/add-all design-system recipe: adding competition code before the event is prohibited; eventual implementation should add only needed primitives.

## Measured token contrast

Computed from proposed sRGB hex tokens using relative luminance and `(Llighter + 0.05)/(Ldarker + 0.05)`. These are token pair measurements, not screenshots or rendered accessibility verification.

| Pair | Dark | Light |
| --- | --- | --- |
| Primary text / background | 15.00:1 | 13.58:1 |
| Secondary text / background | 8.64:1 | 5.94:1 |
| Secondary text / surface | 7.64:1 | 6.38:1 |
| Filled action text / action background | 8.31:1 | 7.31:1 |
| Control border / surface | 4.79:1 | 4.48:1 |
| Focus color / surface | 8.54:1 | 7.03:1 |
| Destructive text / surface | 7.75:1 | 7.42:1 |

Principal text pairs exceed 4.5:1; tested control/focus pairs exceed 3:1. Actual interactive states, opacity, charts, adjacency and typography still need rendered review. Border-subtle is deliberately excluded from required control identification.

## Verification status

Completed: repository/instruction inspection, skill review/installation, planning artifacts, principal token contrast calculation, document integrity checks listed below.

Document integrity check: passed across all 8 Markdown files. Checked relative file links, balanced code fences, trailing whitespace, JSON example parsing, presence of all 14 requested scientific/interaction model declarations, and absence of application source/manifests. Result: zero errors and zero application source/manifests. This was a one-off Python document check, not an application test suite.

Not performed: dependency compatibility resolution, TypeScript compilation, production build, automated component tests, Playwright runs, screenshots, touch-device checks, host routing checks, Flask integration, scientific dataset/model validation. There is no runnable app on which to perform these checks. No application acceptance criterion is claimed satisfied by documentation alone.

## Remaining implementation decisions

- Exact event start time and current official rule text.
- Event-time dependency versions, actual shadcn primitive availability and font licenses/files.
- Backend approval of routes, response timing, idempotency/revision guarantees, authentication and file policy.
- Verified per-investigation source metadata before creating fixtures; no actual NASA numerical dataset has been selected.
- Rendered design quality, accessibility, performance and browser compatibility after implementation.

These limits do not prevent completion of the authorized planning scope. The ordered checklist supplies the next execution steps without scheduling work before the event.

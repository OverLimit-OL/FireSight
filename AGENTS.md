# Repository Guidelines

## Project Status and Timing Boundary

Fire-XII currently contains planning documents only. Before implementing competition code, verify the selected event’s permitted start time and record its timezone and source. Until then, limit contributions to specifications, wireframes, API contracts, and checklists. Do not scaffold the application or install application dependencies prematurely.

## Project Structure & Module Organization

- `README.md` indexes the package and explains current limitations.
- `DESIGN.md` defines the Evidence notebook identity, tokens, and interactions.
- `API_CONTRACT.md` documents proposed, unconfirmed Flask contracts.
- `docs/` contains architecture, wireframes, backend handoff, preflight findings, and development gates.

The planned application belongs in `frontend/`, with feature modules under `src/features/`, shared components under `src/components/`, adapters under `src/services/`, component/domain tests under `src/tests/`, and browser tests under `e2e/`. Source, tests, and assets do not exist yet. Keep backend implementation separate.

## Build, Test, and Development Commands

No package manifest, runnable application, or build/test scripts currently exist. Do not claim `npm test` or `npm run build` works. After implementation is permitted, establish and verify scripts for development, typechecking, production builds, linting, unit tests, and browser tests; document actual commands in `README.md`.

For document changes, check relative links, fenced examples, trailing whitespace, and consistency between specifications.

## Coding Style & Naming Conventions

Use concise Markdown with descriptive headings and relative document links. For future code, use strict TypeScript, two-space indentation, PascalCase React components, camelCase functions, and feature-based modules. Configure formatting and linting during setup; neither is installed now. Keep scientific types independent of React and fixtures outside page components.

## Testing Guidelines

Planned tools are Vitest, React Testing Library, and Playwright. Use `*.test.ts(x)` for unit/component tests and `*.spec.ts` for browser flows. No numeric coverage threshold exists; prioritize context preservation, provenance, persistence, accessibility, and failure recovery. Follow the viewport matrix in `docs/DEVELOPMENT_CHECKLIST.md`; report only checks actually run.

## Commit & Pull Request Guidelines

No Git history establishes conventions. Use concise imperative subjects, such as `docs: clarify evidence provenance`. PRs should explain scope, reference affected specifications/issues, list actual validation, and include screenshots for implemented visual changes. Distinguish plans from verified behavior.

## Scientific Integrity & Configuration

Never invent NASA measurements, citations, confidence scores, or conclusions. Label synthetic data explicitly. Keep demo and HTTP modes separate, preserve missing-data states, and never place secrets in public Vite configuration.

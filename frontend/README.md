# FireSight frontend

See the [repository README](../README.md) for setup, features, scientific boundaries and the full documentation index.

```bash
npm ci
npm run dev
npm run typecheck
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

The project uses React 19, strict TypeScript 7, Vite 8, Tailwind 4, customized Radix-based shadcn source, TanStack Query, React Router and Recharts. Self-hosted fonts are IBM Plex Sans/Mono and Source Serif 4 (Fontsource packages, SIL Open Font License). Markdown uses react-markdown/GFM; formulas use KaTeX with trust disabled.

`VITE_DATA_MODE=demo` is explicit in `.env`. See `.env.example` for HTTP mode. No API key belongs in public Vite configuration. Tests never require Flask or an AI provider. Build output is `dist/`; application routes require SPA rewrites on the deployment host.

Use two spaces, single quotes and no semicolons; `.prettierrc.json` defines formatting. Run `npm run format` after edits. Oxlint checks React/TypeScript; runtime contracts are validated with Zod. Test observable behavior and provenance, not implementation details.

Screenshots, traces and HTML reports live under `output/playwright/`. Device widths emulate layout; they are not proof of physical-device keyboard behavior. Current backend limitations and measured results are documented in [the implementation report](../docs/IMPLEMENTATION_REPORT.md).

Simulation Studio is at `/lab`; create at `/lab/new`, reopen at `/lab/studio/:simulationSessionId`. Existing data notebooks remain at `/lab/:sessionId` and `/lab?notebook=1`. See the [Phase 2 report](../docs/PHASE_2_IMPLEMENTATION_REPORT.md) and [actual simulation contract](../docs/PHASE_2_CLIENT_CONTRACT.md). The optional 3D renderer adds React Three Fiber/Three.js, loaded only for spatial point views. All example outputs are illustrative authored fixtures.

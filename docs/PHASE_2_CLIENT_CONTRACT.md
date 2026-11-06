# Implemented simulation client profile

November 1, 2026. This is the actual first frontend adapter profile. The [broader simulation proposal](PHASE_2_API_CONTRACT.md) remains the target architecture, not a description of implemented Flask routes. No backend is included.

## Runtime contract authority

`frontend/src/types/simulation.ts` contains strict TypeScript types derived from Zod schemas. `frontend/src/services/simulation/SimulationApi.ts` is the component-facing interface. MockSimulationApi and HttpSimulationApi implement that interface; mode is selected by the same explicit Vite configuration as ResearchApi. The origin excludes `/api/v1`. HTTP errors never select fixtures.

Success is `{ "data": ... }`; list data is `{ "items": [], "nextCursor": null }`. Errors should be `{ "error": { "message": "..." } }`; 404, 409 and 422 map to missing, conflict and validation errors. Network/5xx failures are explicit; successful malformed payloads are rejected. GET operations accept abort signals. List pagination rejects repeated cursors and bounds collection size at 10,000 items. This is not a large-field streaming implementation.

## Implemented adapter requests

| Method | Path below `/api/v1` | Request / response data |
| --- | --- | --- |
| GET | `/simulation-models` | Paged SimulationModel |
| GET | `/simulation-models/:id?version=...` | Exact SimulationModel |
| GET | `/simulation-sessions` | Paged SimulationSession |
| POST | `/simulation-sessions` | `{title, modelId, modelVersion, configuration, studyIds, parent?}` → SimulationSession |
| GET | `/simulation-sessions/:id` | SimulationSession |
| PATCH | `/simulation-sessions/:id` | `{version, title, notes, configuration?}` → updated SimulationSession |
| GET | `/simulation-sessions/:id/runs` | Paged SimulationRun |
| POST | `/simulation-sessions/:id/runs` | `{revisionId}`, `Idempotency-Key` header → full SimulationRun, normally HTTP 202 |
| GET | `/simulation-runs/:id` | SimulationRun |
| POST | `/simulation-runs/:id/cancel` | Full updated SimulationRun, including an intermediate cancelling status where applicable |
| GET | `/simulation-runs/:id/frames` | Paged complete SimulationFrame records |
| GET | `/resources/:id/simulation` | Available pinned session/run/frame/source, or unavailable with reason |
| POST | `/simulation-contexts` | AIAnalysisContext → stored immutable AIAnalysisContext |
| GET | `/simulation-contexts/:id` | AIAnalysisContext |

The application polls active run lists every 2 seconds in HTTP mode (350 ms for the local scripted demo), stopping once all runs are terminal. Playback state is independent and never sends computation pause requests. A cancelling response remains active until the server reports a terminal status. Completion may win a cancellation race. SSE, server Retry-After scheduling and streaming frame manifests are not implemented in this first profile.

## Deliberately bounded first profile

The current editor supports one declared enum input: `sequenceId: 'reference' | 'offset'`. Do not expose a physical model through it by inventing equivalences. Extending to generic declared physical inputs requires matching editor/schema/service changes and applicability validation. The initial point-sample adapter renders complete field payloads; the richer manifest/field encoding proposal is deferred. Frames carry identity, a field domain/unit/rank and `{entityId, coordinates:[x,y,z], value:number|null}` samples.

Sessions contain an integer mutation `version`, immutable `revisions`, model identity/version, optional parent reference and user notes. Configuration changes create a new revision with a fresh ID and digest; renaming/notes do not. The local digest is SHA-256 of schema-ordered JSON for this enum configuration. Flask must specify its canonical rules before broadening the inputs. Local run IDs double as idempotency keys; this is not a required server ID format. The local fixture selector/outcome fields in SimulationRun are nullable and have no solver semantics; HTTP submissions omit the demo outcome.

Captured contexts always include session/model/revision/digest identity. `runId`, `frameId`, timestamp and selected measurement are nullable so configuration and unfinished-job questions do not manufacture results. Output context is verified against exact frame values. ResearchContext carries the complete optional nullable `simulationContext` snapshot; `/simulation-contexts/:id` allows new-chat URLs to survive refresh. Flask must retain and echo this optional field in conversations/messages; dropping it silently is not acceptable.

The full planning proposal's separate revision/validation/results endpoints, applicabilityReceiptId, run-receipt envelope and model input union are **not consumed by this bounded adapter**. Negotiate them before replacing this profile. Current UI never certifies validated simulation applicability from a model flag.

## Example configuration creation

```json
{
  "title": "Illustrative sample review",
  "modelId": "illustrative-field-sequence",
  "modelVersion": "1.0.0",
  "configuration": { "sequenceId": "reference" },
  "studyIds": []
}
```

## Local ownership

Sessions, immutable revisions, runs, contexts and browser drafts stay on the current browser origin in demo mode. No simulation configuration, selected file or scientific record is uploaded. The asynchronous demo lifecycle uses wall-clock time to replay queued/running/completed or failed states; it survives page reload. Canceled/failed runs expose no frames. Forks copy configuration and a parent reference, with fresh IDs and no inherited runs. Local storage is neither a database nor a cross-device synchronization service.

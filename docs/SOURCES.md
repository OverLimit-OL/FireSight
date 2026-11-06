# Scientific source register

High-level investigation descriptions were checked against NASA sources on October 31, 2026. The frontend contains original short paraphrases of research objectives, not imported findings, publication dates, measurements or conclusions. Source-level metadata is intentionally incomplete where not verified.

| Investigation | Source | Scope used |
| --- | --- | --- |
| BASS | [NASA Glenn Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/) | Burning/extinction of solid fuels in microgravity |
| BASS-II | [NASA Physical Sciences Informatics, PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25) | Ignition, growth, spread and extinction of solid fuels in low-velocity microgravity flows |
| FLEX | [NASA Glenn Combustion Science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/) | Study of inert-gas suppression in microgravity |
| SAME | [NASA SAME overview](https://www.nasa.gov/wp-content/uploads/2025/07/smoke-aerosol-measurement-experiment-same.pdf) and [NASA technical publication](https://www.nasa.gov/wp-content/uploads/2022/03/iss_technical_publication_030116.pdf) | Smoke characterization and spacecraft smoke detection |
| Saffire | [NASA PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98) and [NASA Saffire overview](https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf) | Spacecraft fire behavior investigation |

NASA Glenn page content was directly fetched. Several other descriptions were corroborated through indexed official source excerpts; detailed source records and full numerical datasets were not imported. Do not interpret these entries as independent reproduction of experimental results. Source dates are null in fixtures, rather than invented.

## Demonstration content

`frontend/src/services/mock/fixtures.ts` owns the five overview records, suggested questions, deterministic response template, synthetic dataset metadata and generated rows. React pages do not contain scripted response text or scientific measurements.

The illustrative dataset has 24 ordered samples and two dimensionless generated signals. One signal includes a deliberate null sample to verify gap handling. The curves have no physical interpretation and no NASA study attribution: dataset.studyId and dataset.source are null. A Lab session may hold a separate NASA study context alongside them; that association does not make the signals NASA data.

Scripted responses identify themselves and do not respond intelligently to the question or parse attachments. Evidence panels classify attributed objective summaries as interpretations, with partial provenance and no uncertainty estimate. The response explicitly separates objectives from findings. No confidence percentage or scientific prediction is synthesized.

Source links are opened only after the user chooses them; no NASA data ingestion, real AI request, telemetry or third-party attachment transmission is performed.

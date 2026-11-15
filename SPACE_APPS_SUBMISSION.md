# Fire-XII — Space Apps submission

## Summary

Fire-XII is a scientific research workspace that connects NASA microgravity combustion resources, contextual AI conversations and an interactive virtual laboratory. We developed a React and TypeScript application with schematic 3D apparatus, a shared 2D view, component inspection, synchronized observation playback, linked scalar charts and saved experiment configurations. Researchers can explore investigations such as FLEX and BASS, inspect source-linked evidence, attach documents and ask follow-up questions using Gemini. A FastAPI backend stores account-specific conversations and experiments and encrypts each user’s API key. The project addresses the difficulty of moving between research records, visual context and scientific questions by keeping them in one workflow. Its importance lies in making combustion research more approachable and traceable. The Lab currently demonstrates illustrative geometry and authored frames, with scientific limitations displayed throughout. We used OpenAI Codex to assist with implementation, debugging, testing and documentation.

## Project Demonstration

https://canva.link/479fblnow88vicv

Seven-slide Canva presentation, including the title. Public view-only link, verified in a separate browser session without a Canva login. Each slide includes “SI-generated visuals · Codex-assisted code & content.”

## Project

https://firesight-production.up.railway.app/welcome

This public project overview is accessible without an account. The presentation demonstrates the workflow. Personal workspace features require registration, and Gemini conversations require the user’s own API key.

## Project Details

### What we developed

Fire-XII brings a research library, evidence-aware conversations and a virtual scientific Lab into one application. The intended users are students, educators and researchers exploring combustion in microgravity. It offers an approachable way to navigate NASA investigation context while keeping source references available.

### How it works

Users can browse and filter investigation records, open original sources and carry study context into Chat. Gemini receives relevant investigation material, curated NASA-source paraphrases, bounded extracted document text and previous conversation turns. Follow-up questions can build on the preceding discussion. Cited evidence opens an inspector with source passages, provenance and limitations. Uploaded documents remain associated with the conversation for follow-ups.

The Lab contains a schematic experimental enclosure, solid-fuel sample, supporting apparatus, observation point and illustrative combustion region. Users can switch between 2D and 3D, select components, focus the camera, adjust visualization settings, load authored observations and explore synchronized frames and scalar plots. Configuration revisions remain separate from saved outputs. A contextual Copilot carries the selected component, frame and research context into a conversation. The feature guide explains onboarding and the main research and Lab tools.

The application uses React, TypeScript, Vite, React Three Fiber, Three.js and Recharts. FastAPI and Python provide the API, SQLite stores account-specific records on a persistent Railway volume, and the Gemini API provides contextual text responses. Passwords are hashed, session cookies are HTTP-only, and Gemini API keys are encrypted on the server. OpenAI Codex assisted implementation, debugging, testing and documentation. Canva was used to create the presentation.

### Benefits, creativity and intended impact

The creative contribution is the connection between evidence, conversation and direct inspection of an experimental representation. A question can retain its study context as the user moves into the Lab and back into Chat. This supports learning and exploratory research while making the available evidence and missing information visible. The intended impact is easier understanding of NASA combustion investigations and a foundation for future scientific-data integration.

### Scientific and operational scope

NASA resources supply investigation context and curated qualitative explanations. The bundled scalar sequences are dimensionless, illustrative, preauthored examples. The current Lab has no combustion solver or validated predictive model. The schematic solid-fuel apparatus is inspired by BASS and does not reconstruct FLEX’s droplet apparatus. Numerical NASA datasets and run-level validation are future integration work. Gemini answers require source review before scientific use. Email verification, password recovery and broader operational hardening remain future work.

## Use of Super Intelligence (SI)

Select the form options corresponding to AI-assisted code, text, chatbot/LLM use and SI-generated presentation visuals. The exact checkbox names depend on the submission form.

I used OpenAI Codex to help inspect the codebase, implement and refine frontend and backend features, debug issues, write tests, organize source-linked explanations and draft documentation and submission text. Google Gemini powers the application’s contextual research assistant using supplied research material and conversation history. Canva’s AI-assisted design tools created the presentation layout and generated illustrative visuals. The presentation visibly labels the SI-generated visuals and Codex assistance on every slide.

The illustrative scalar sequences and schematic scene are software demonstration assets, including SI-assisted code and authored fixture content. They are labeled as illustrative in the application. NASA scientific datasets have not been generated or claimed. NASA source material is credited through original links. No NASA logo, flag, insignia or agency branding was generated or modified for the presentation. No video or audio was produced for this demonstration.

## NASA Data

The following NASA resources are referenced in the application’s research catalog or curated explanatory context. They are credited as resources and qualitative source material. Numerical experimental datasets are not connected.

| Link Text | Link URL |
| --- | --- |
| NASA Glenn — Combustion Science | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/ |
| NASA Physical Sciences Informatics — BASS-II, PSI-25 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-25 |
| NASA Glenn — Flame Extinguishment Experiment overview | https://gipoc.grc.nasa.gov/wp/fcf-cir/flex/ |
| NASA — Droplet Flame Extinguishment in Microgravity, Research Requirements Document | https://www1.grc.nasa.gov/wp-content/uploads/FLEX_EIRD_v4.pdf |
| NASA — You’re Hot Then You’re Cold | https://www.nasa.gov/missions/station/iss-research/youre-hot-then-youre-cold/ |
| NASA — Smoke Aerosol Measurement Experiment | https://www.nasa.gov/wp-content/uploads/2025/07/smoke-aerosol-measurement-experiment-same.pdf |
| NASA Physical Sciences Informatics — Saffire-I, PSI-98 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-98 |

## Space Agency Partner & Other Data

No additional space-agency datasets are connected. The project uses these software tools, libraries, fonts and services. Dependency versions are recorded in the repository’s package manifest and lockfile.

| Link Text | Link URL |
| --- | --- |
| OpenAI Codex — SI-assisted implementation, debugging and documentation | https://openai.com/codex/ |
| Google Gemini API — contextual research conversations | https://ai.google.dev/gemini-api/docs |
| Google AI Studio — user API-key setup | https://aistudio.google.com/apikey |
| Canva — SI-assisted presentation design and generated visuals | https://www.canva.com/ |
| React | https://react.dev/ |
| TypeScript | https://www.typescriptlang.org/ |
| Vite | https://vite.dev/ |
| React Three Fiber | https://r3f.docs.pmnd.rs/ |
| Three.js | https://threejs.org/ |
| Recharts | https://recharts.org/ |
| FastAPI | https://fastapi.tiangolo.com/ |
| Python | https://www.python.org/ |
| SQLite | https://www.sqlite.org/ |
| Railway | https://railway.com/ |
| TanStack Query | https://tanstack.com/query/latest |
| React Router | https://reactrouter.com/ |
| Zod | https://zod.dev/ |
| Tailwind CSS | https://tailwindcss.com/ |
| shadcn/ui | https://ui.shadcn.com/ |
| Radix UI | https://www.radix-ui.com/ |
| Lucide icons | https://lucide.dev/ |
| React Markdown | https://github.com/remarkjs/react-markdown |
| KaTeX | https://katex.org/ |
| pypdf — uploaded PDF text extraction | https://pypdf.readthedocs.io/ |
| HTTPX | https://www.python-httpx.org/ |
| cryptography — API-key encryption | https://cryptography.io/ |
| Plus Jakarta Sans | https://fonts.google.com/specimen/Plus+Jakarta+Sans |
| IBM Plex Sans | https://fonts.google.com/specimen/IBM+Plex+Sans |
| IBM Plex Mono | https://fonts.google.com/specimen/IBM+Plex+Mono |
| Source Serif 4 | https://fonts.google.com/specimen/Source+Serif+4 |
| Playwright — browser verification | https://playwright.dev/ |
| Vitest — frontend tests | https://vitest.dev/ |

## Submission check

The public overview and public Canva presentation can be viewed without registration. The private source repository is not used as the public project link. Confirm the selected Space Apps challenge title and team attribution in the submission form before submitting. This file supplies the requested text and links and does not submit the form.

# Phase 3 — The experiment as the working surface

The Lab serves a researcher inspecting an illustrative solid-fuel experiment, its authored playback sequence, and the evidence that is missing. The signature is a cutaway flow tunnel on an optical bench. The apparatus is the hero; numerical samples remain a separate analysis surface.

## Visual system

Retain the Evidence notebook identity and existing theme tokens. Use Source Serif 4 for the scene heading, IBM Plex Sans for controls, and IBM Plex Mono for coordinates and technical captions. Scene tokens: instrument navy `#192935`, panel slate `#203440`, structural steel `#8c9ca7`, annotation blue `#a1c0cd`, sample amber `#f0c496`, label white `#dce6ea`. The instrument surface remains dark in both themes to maintain scene contrast; surrounding notebook surfaces follow the selected theme.

## Composition

The desktop workspace is a configuration column beside a wide viewport, followed by synchronized playback, a collapsible sample trace and run comparison. Copilot docks on the right at 1200px and above; smaller widths use a modal drawer. Configuration is initially collapsed below 1000px and can be opened explicitly. The setup flow places a scene preview alongside the guided form and stacks them on narrower screens.

The initial camera reveals the test enclosure, inlet, mounted solid sample, combustion envelope and schematic camera. Camera fitting accounts for viewport aspect ratio. Orbit, zoom, reset, component focus and a focus-view layout are available. Object buttons provide equivalent keyboard selection. A 2D orthographic schematic represents the same components, preserving component and playback selections. A separate exact-sample table retains the existing fixture analysis functionality.

## Scientific boundary

NASA's [BASS-II record](https://ntrs.nasa.gov/citations/20160000593) describes a flow tunnel inside the Microgravity Science Glovebox. This supports the conceptual research context, not the dimensions or geometry of this frontend scene. No apparatus reconstruction, physical flame calculation, NASA measurement, calibrated sensor placement, confidence score or safety conclusion is asserted.

The flame has discrete authored poses selected by the existing playback frame. It has no independent animation clock. The scalar fixtures remain dimensionless examples and are not mapped to apparatus components or presented as temperature. Environmental controls are unavailable with an explanation. Configuration revisions remain separate from immutable run results.

## Interaction continuity

- Resources: BASS has an explicitly illustrative companion, source link, component metadata and a creation link that preserves study and component.
- Creation: select the existing supported model/sequence, choose independent or BASS research context, name the experiment, inspect the scene, review limitations and save locally.
- Lab: load authored frames separately; select a component or exact scalar sample; inspect source context and limitations.
- Copilot: local scripted prompts describe the exact selected state; continuing in Chat captures component, model, revision, run, frame, timestamp, measurement, evidence and study IDs.
- Chat: preserve the context chip and reopen the selected Lab state. No LLM backend is introduced.

## Technical references applied

- [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction): declarative scene composition using the existing React 19-compatible Fiber dependency.
- [React Three Fiber first scene](https://r3f.docs.pmnd.rs/getting-started/your-first-scene): camera, lighting, meshes and geometry.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): visible labels, keyboard alternatives, focus, responsive sizing and accessible controls.

The implementation uses existing Three.js OrbitControls, demand rendering, lazy loading and reusable scene components. It adds no runtime dependency.

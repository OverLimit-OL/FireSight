# Phase 4 — Scientific workstation

The Lab is a bounded instrument surface for a researcher exploring an illustrative solid-fuel experiment. The apparatus, selection, exact output frame and evidence stay visible together. This is a focused refactor of the existing React frontend, not a new application or scientific engine.

## Composition and identity

Retain the Fire-XII palette, IBM Plex Sans controls, IBM Plex Mono technical labels and restrained Source Serif headings. Use the existing instrument navy and steel materials. The experiment is the visual focus; panel separators encode working regions rather than decorative cards.

```text
App navigation | contextual title, configuration, research, run commands
               | validity / revision / run / frame
               | setup  :        viewport         : inspector / Copilot / evidence
               |        :                         :
               |        : timeline / measurements :
               |        : comparison / saved runs  :
               | compact status
```

The desktop Lab occupies the available viewport height. Configuration and research panels have keyboard- and pointer-resizable separators. The bottom analysis dock resizes vertically, and collapse retains playback controls. The application navigation remains independently collapsible. A viewport focus mode supports detailed inspection. Panel content scrolls within its own dock; the Lab page does not scroll.

Below 1100px, configuration and research use exclusive accessible drawers with explicit triggers and focus restoration. Drawer and desktop instances are not mounted simultaneously. At narrow widths, the toolbar wraps to two compact rows; the scene and timeline retain the available height.

## Scientific representation

The BASS-inspired schematic retains its established research boundary. Rounded structural members, mounting feet, fasteners, an inset test deck, support sleeves and optical lens rings improve mechanical readability. Controlled lighting, shadow frustum, fog, surface roughness and softened geometry improve depth. A smooth authored combustion envelope responds only to the selected frame. No fluid dynamics, calibrated geometry or physical flame computation is implied.

Selection highlights the corresponding component and updates its annotation and Inspector. Focus is explicit. Camera fitting on panel resize adjusts distance while preserving orientation. The orthographic representation shares object and frame selection. Scalar samples remain separate from apparatus components unless a future data contract supplies a calibrated relationship.

## Capabilities and persistence

Typed parameter profiles bind supported UI controls to a model identity/version. Editable visualization settings are independent of scientific configuration revisions and run results. The existing internal reference/offset bundles appear as baseline/alternative demonstration configurations. Engine-required and unsupported conditions explain their status without presenting editable scientific values.

Versioned local records store dock dimensions, per-session visualization settings and context-stamped Copilot messages. Existing session, revision, run and evidence stores remain intact. Unknown model versions do not inherit scientific inputs from the illustrative profile.

## Analysis and assistance

The existing Timeline remains the single playback controller. Chart point selection updates frame and selected sample atomically in the URL. Exact values, missing samples and the cursor share that state. Comparison shows two saved authored runs at matching dimensionless steps, without implying physical time equivalence or NASA provenance.

Inspector, Copilot and Evidence occupy tabs in one right dock. Prepared questions expose known context and limitations. The conversation form records free-text questions with object/frame/run metadata and explicitly reports that no inference service is connected. Continuing in Research Chat captures the existing typed analysis snapshot, extended with optional comparison identity.

Resources use a compact renderer variant with view controls, object metadata and a full-Lab link, without duplicating configuration, timeline or assistant docks. Study → new Lab preserves object and view; Lab → study → Lab additionally preserves the existing session, run and frame.

## References applied

- [React Three Fiber scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance): on-demand rendering, explicit camera invalidation and disposal.
- [Three.js documentation](https://threejs.org/docs/): existing OrbitControls and RoundedBoxGeometry addons; no new rendering dependency.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): labeled icon buttons, keyboard alternatives, scroll-region focus, responsive state and accessible forms.
- Scientific context remains the [NASA BASS-II record](https://ntrs.nasa.gov/citations/20160000593); it does not establish the proportions or dynamics of this schematic.

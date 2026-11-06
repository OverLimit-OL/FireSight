import { defaultSceneSettings } from './sceneSettings'
import type { SceneSettings } from './sceneSettings'
import { Component, lazy, Suspense, useRef, useState } from 'react'
import { Camera, Hand, Scan, Focus, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SimulationFrame } from '@/types/simulation'
import { Button } from '@/components/ui/button'
import ApparatusSection from './ApparatusSection'
import { previewFrame } from './previewFrame'
import { apparatus, componentById } from './apparatus'
const ThreeDimensionalView = lazy(() => import('./ThreeDimensionalView'))

class RenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
export default function ExperimentViewport({
  frame = previewFrame,
  selected = 'sample',
  onSelect,
  mode,
  onMode,
  variant = 'full',
  settings,
  onSettings,
  onInspect,
  onAsk,
  focusRequest = 0,
  split = false,
}: {
  frame?: SimulationFrame
  selected?: string
  onSelect: (id: string) => void
  mode?: 'slice' | 'points'
  onMode?: (mode: 'slice' | 'points') => void
  variant?: 'full' | 'workstation' | 'embedded'
  settings?: SceneSettings
  onSettings?: (settings: SceneSettings) => void
  onInspect?: () => void
  onAsk?: () => void
  split?: boolean
  focusRequest?: number
}) {
  const [localMode, setLocalMode] = useState<'slice' | 'points'>('points')
  const [rendererFailed, setRendererFailed] = useState(false)
  const view = rendererFailed ? 'slice' : (mode ?? localMode)
  const changeMode = onMode ?? setLocalMode
  const [panTool, setPanTool] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [preset, setPreset] = useState(0)
  const [cameraReset, setCameraReset] = useState(0)
  const [localSettings, setLocalSettings] = useState(defaultSceneSettings)
  const scene = settings ?? localSettings
  const changeSettings = onSettings ?? setLocalSettings
  const { annotations, guides: overlays, apparatus: visible } = scene
  const [expanded, setExpanded] = useState(false)
  const [focus, setFocus] = useState(false)
  const [message, setMessage] = useState('')
  const root = useRef<HTMLElement>(null)
  const component = componentById(selected)
  const pan: [number, number] =
    focus && component ? [component.position[0], component.position[1]] : [0, 0]
  function capture() {
    const canvas = root.current?.querySelector('canvas')
    const svg = root.current?.querySelector('svg.apparatus-section')
    const link = document.createElement('a')
    if (view === 'points' && canvas) {
      link.href = canvas.toDataURL('image/png')
      link.download = `firesight-illustrative-step-${frame.coordinate.value}.png`
    } else if (svg) {
      link.href = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
      )
      link.download = 'firesight-schematic.svg'
    } else {
      setMessage('The view is still loading. Try again.')
      return
    }
    link.click()
    if (link.href.startsWith('blob:')) URL.revokeObjectURL(link.href)
    setMessage('Illustrative visualization exported. Scientific data are not included.')
  }
  return (
    <section
      ref={root}
      className={`experiment-viewport scene-${variant} ${expanded ? 'viewport-focus' : ''}`}
      role={expanded ? 'dialog' : 'region'}
      aria-modal={expanded ? true : undefined}
      aria-label="Interactive combustion experiment"
      onKeyDown={(e) => {
        if (expanded && e.key === 'Tab') {
          const controls = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex="0"]',
            ),
          ).filter((el) => el.getClientRects().length > 0)
          const first = controls[0],
            last = controls.at(-1)
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
        if (e.key === 'Escape' && expanded) {
          e.stopPropagation()
          setExpanded(false)
        }
      }}
    >
      <div className="experiment-toolbar">
        <div>
          <span className="scene-status-dot" /> EXPERIMENT VIEW
        </div>
        <div className="view-switch" hidden={split}>
          <Button
            type="button"
            size="sm"
            variant={view === 'slice' ? 'secondary' : 'ghost'}
            aria-pressed={view === 'slice'}
            onClick={() => changeMode('slice')}
          >
            2D section
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === 'points' ? 'secondary' : 'ghost'}
            aria-pressed={view === 'points'}
            onClick={() => changeMode('points')}
          >
            3D apparatus
          </Button>
        </div>
      </div>
      <div className="experiment-canvas">
        <div className="scene-caption">
          <span className="eyebrow">Solid fuel · flow tunnel</span>
          <h2>Solid-fuel test section</h2>
          <p>BASS-inspired apparatus · schematic geometry</p>
        </div>
        {view === 'points' ? (
          <RenderBoundary
            fallback={
              <div className="viewport-fallback">
                <p>3D rendering is unavailable. Your selected state is retained.</p>
                <Button type="button" onClick={() => changeMode('slice')}>
                  Use 2D view
                </Button>
              </div>
            }
          >
            <Suspense fallback={<p className="viewport-fallback">Loading apparatus…</p>}>
              <ThreeDimensionalView
                frame={frame}
                selectedId={selected}
                onSelect={onSelect}
                onFailure={() => {
                  setRendererFailed(true)
                  changeMode('slice')
                }}
                panTool={panTool}
                preset={preset}
                focusRequest={focusRequest}
                focusPoint={component?.position ? [...component.position] : [0, 0, 0]}
                cameraReset={cameraReset}
                zoom={zoom}
                pan={pan}
                apparatusVisible={visible}
                overlays={overlays}
                combustion={scene.combustion}
                exposure={scene.exposure}
              />
            </Suspense>
          </RenderBoundary>
        ) : (
          <ApparatusSection
            selected={selected}
            onSelect={onSelect}
            step={frame.coordinate.value}
            visible={visible}
            annotations={annotations}
            overlays={overlays}
            combustion={scene.combustion}
          />
        )}
        {annotations && view === 'points' ? (
          <div className="scene-annotation">
            <span /> {component?.name ?? 'Synthetic sample'}
          </div>
        ) : null}
        <div className="camera-rail">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Orbit camera"
            disabled={view === 'slice'}
            onClick={() => {
              setPanTool(false)
              setPreset((p) => p + 1)
            }}
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Pan camera"
            aria-pressed={panTool}
            disabled={view === 'slice'}
            onClick={() => setPanTool((p) => !p)}
          >
            <Hand />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fit experiment"
            disabled={view === 'slice'}
            onClick={() => {
              setFocus(false)
              setZoom(1)
              setPreset(0)
              setCameraReset((n) => n + 1)
            }}
          >
            <Scan />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom camera in"
            disabled={view === 'slice'}
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
          >
            <ZoomIn />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom camera out"
            disabled={view === 'slice'}
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          >
            <ZoomOut />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset camera"
            disabled={view === 'slice'}
            onClick={() => {
              setPreset(0)
              setCameraReset((n) => n + 1)
              setZoom(1)
              setFocus(false)
            }}
          >
            <Focus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Focus selected component"
            disabled={view === 'slice'}
            onClick={() => {
              setFocus(true)
              setZoom(0.65)
            }}
          >
            <Maximize2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Export visualization"
            onClick={capture}
          >
            <Camera />
          </Button>
        </div>
        <div className="scene-footnote">
          <span>ILLUSTRATIVE DEMONSTRATION</span>
          <span>
            Step {frame.coordinate.value} ·{' '}
            {view === 'points' ? 'Drag to orbit · right-drag to pan' : 'Orthographic section'}
          </span>
        </div>
      </div>
      <div className="scene-options">
        <label>
          <input
            type="checkbox"
            checked={annotations}
            onChange={(e) => changeSettings({ ...scene, annotations: e.target.checked })}
          />{' '}
          Annotations
        </label>
        <label>
          <input
            type="checkbox"
            checked={overlays}
            onChange={(e) => changeSettings({ ...scene, guides: e.target.checked })}
          />{' '}
          Coordinate & flow guides
        </label>
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => changeSettings({ ...scene, apparatus: e.target.checked })}
          />{' '}
          Apparatus
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-pressed={expanded}
        >
          {expanded ? 'Exit focus' : 'Focus view'}
        </Button>
      </div>
      {variant !== 'full' ? (
        <div className="scene-selection-bar">
          <label>
            <span className="sr-only">Inspect component</span>
            <select
              aria-label="Inspect component"
              value={component ? selected : ''}
              onChange={(e) => onSelect(e.target.value)}
            >
              {!component ? <option value="">Synthetic sample {selected}</option> : null}
              {apparatus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {variant === 'workstation' ? (
            <>
              <Button type="button" size="sm" variant="ghost" onClick={onInspect}>
                Inspect selection
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onAsk}>
                Ask AI about selection
              </Button>
            </>
          ) : (
            <span className="embedded-component-role">
              {component?.role ??
                'This synthetic sample has no calibrated apparatus location. Its Lab selection is retained.'}
            </span>
          )}
        </div>
      ) : null}
      <div className="component-ribbon" aria-label="Experiment objects">
        {apparatus.map((c) => (
          <button
            type="button"
            key={c.id}
            aria-pressed={selected === c.id}
            onClick={() => onSelect(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="component-description" aria-live="polite">
        <strong>{component?.name ?? 'Synthetic sample selected'}</strong>
        <p>
          {component?.role ??
            'Use the exact sample table and trace for authored scalar values. These values are not calibrated apparatus measurements.'}
        </p>
      </div>
      {message ? (
        <p className="scene-export-status" role="status">
          {message}
        </p>
      ) : null}
    </section>
  )
}

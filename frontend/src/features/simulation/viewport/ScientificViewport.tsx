import { useEffect, useState } from 'react'
import ApparatusSection from './ApparatusSection'
import { previewFrame } from './previewFrame'
import type { SceneSettings } from './sceneSettings'
import { Button } from '@/components/ui/button'
import type { SimulationFrame } from '@/types/simulation'
import ExperimentViewport from './ExperimentViewport'
export type ViewMode = 'slice' | 'points' | 'table'
export default function ScientificViewport({
  frame = previewFrame,
  view,
  onView,
  selectedId,
  onSelect,
  settings,
  onSettings,
  onInspect,
  onAsk,
  focusRequest,
  split = false,
}: {
  frame?: SimulationFrame
  view: ViewMode
  onView: (view: ViewMode) => void
  selectedId: string
  onSelect: (id: string) => void
  settings?: SceneSettings
  onSettings?: (settings: SceneSettings) => void
  onInspect?: () => void
  onAsk?: () => void
  split?: boolean
  focusRequest?: number
}) {
  const [splitSupported, setSplitSupported] = useState(() => matchMedia('(min-width: 700px)').matches)
  useEffect(() => {
    const query = matchMedia('(min-width: 700px)')
    const update = () => setSplitSupported(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const linked = split && splitSupported
  return (
    <section
      className={`scientific-viewport ${linked && view !== 'table' ? 'has-linked-section' : ''}`}
    >
      <div className="analysis-view-switch">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(view === 'table' ? 'points' : 'table')}
        >
          {view === 'table' ? 'Return to experiment' : 'Exact sample table'}
        </Button>
      </div>
      {view === 'table' ? (
        <div className="sample-table-wrap">
          <table className="sample-table">
            <caption>
              Illustrative samples at step {frame.coordinate.value}; coordinates and values
              dimensionless.
            </caption>
            <thead>
              <tr>
                <th scope="col">Entity</th>
                <th scope="col">x</th>
                <th scope="col">y</th>
                <th scope="col">z</th>
                <th scope="col">Scalar</th>
                <th scope="col">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {frame.measurements.map((m) => (
                <tr key={m.entityId} data-selected={selectedId === m.entityId}>
                  <th scope="row">{m.entityId}</th>
                  {m.coordinates.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                  <td>{m.value === null ? 'Missing' : m.value.toFixed(3)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Select sample ${m.entityId}`}
                      onClick={() => onSelect(m.entityId)}
                    >
                      Select
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="coordinated-views">
          <ExperimentViewport
            frame={frame}
            selected={selectedId}
            onSelect={onSelect}
            mode={linked ? 'points' : view}
            split={linked}
            onMode={onView}
            variant="workstation"
            settings={settings}
            onSettings={onSettings}
            onInspect={onInspect}
            onAsk={onAsk}
            focusRequest={focusRequest}
          />
          {linked ? (
            <aside className="linked-section" aria-label="Linked 2D section">
              <header>
                <strong>2D section</strong>
                <span>Shared frame · step {frame.coordinate.value}</span>
              </header>
              <ApparatusSection
                selected={selectedId}
                onSelect={onSelect}
                step={frame.coordinate.value}
                visible={settings?.apparatus}
                annotations={settings?.annotations}
                overlays={settings?.guides}
                combustion={settings?.combustion}
              />
              <footer>
                Orthographic schematic
                <br />
                Coordinates are not calibrated.
              </footer>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  )
}

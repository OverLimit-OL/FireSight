import { sceneCapabilities } from '../viewport/sceneSettings'
import type { SceneSettings, ParameterCapability } from '../viewport/sceneSettings'
export default function ParameterControls({
  group,
  capabilities = sceneCapabilities,
  settings,
  onChange,
}: {
  group: ParameterCapability['group']
  capabilities?: ParameterCapability[]
  settings: SceneSettings
  onChange: (settings: SceneSettings) => void
}) {
  return (
    <div className="parameter-controls">
      {capabilities
        .filter((p) => p.group === group)
        .map((p) =>
          p.kind === 'unavailable' ? (
            <div className="unavailable-parameter" key={p.id}>
              <span>{p.label}</span>
              <span className="parameter-status">
                {group === 'engine' ? 'Engine required' : 'Unsupported'}
              </span>
              <p>{p.reason}</p>
            </div>
          ) : (
            <label className={`parameter-control ${p.kind}`} key={p.id}>
              <span>{p.label}</span>
              {p.kind === 'toggle' ? (
                <input
                  type="checkbox"
                  checked={Boolean(settings[p.id])}
                  onChange={(e) => onChange({ ...settings, [p.id]: e.target.checked })}
                />
              ) : (
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={Number(settings[p.id])}
                  onChange={(e) => onChange({ ...settings, [p.id]: Number(e.target.value) })}
                />
              )}
            </label>
          ),
        )}
    </div>
  )
}

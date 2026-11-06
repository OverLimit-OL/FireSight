import { z } from 'zod'
export const sceneSettingsSchema = z.object({
  annotations: z.boolean(),
  guides: z.boolean(),
  apparatus: z.boolean(),
  combustion: z.boolean(),
  exposure: z.number().min(0.5).max(1.5),
})
export type SceneSettings = z.infer<typeof sceneSettingsSchema>
export const defaultSceneSettings: SceneSettings = {
  annotations: true,
  guides: true,
  apparatus: true,
  combustion: true,
  exposure: 1,
}
export type ParameterCapability =
  | {
      id: keyof SceneSettings
      label: string
      kind: 'toggle' | 'range'
      group: 'visualization'
      min?: number
      max?: number
      step?: number
    }
  | {
      id: string
      label: string
      kind: 'unavailable'
      group: 'engine' | 'unsupported'
      reason: string
      unit?: string
    }
export const sceneCapabilities: ParameterCapability[] = [
  { id: 'apparatus', label: 'Enclosure & supports', kind: 'toggle', group: 'visualization' },
  { id: 'combustion', label: 'Combustion envelope', kind: 'toggle', group: 'visualization' },
  { id: 'annotations', label: 'Scientific annotations', kind: 'toggle', group: 'visualization' },
  { id: 'guides', label: 'Coordinate & flow guides', kind: 'toggle', group: 'visualization' },
  {
    id: 'exposure',
    label: 'Scene illumination',
    kind: 'range',
    min: 0.5,
    max: 1.5,
    step: 0.05,
    group: 'visualization',
  },
  {
    id: 'flowVelocity',
    label: 'Flow velocity',
    unit: 'm/s',
    kind: 'unavailable',
    group: 'engine',
    reason: 'Requires boundary conditions and a computational engine.',
  },
  {
    id: 'oxygenFraction',
    label: 'Oxygen fraction',
    unit: '%',
    kind: 'unavailable',
    group: 'engine',
    reason: 'No gas-composition input or solver is connected.',
  },
  {
    id: 'gravity',
    label: 'Gravity environment',
    kind: 'unavailable',
    group: 'unsupported',
    reason: 'This illustration has no gravity-dependent combustion model.',
  },
  {
    id: 'fuel',
    label: 'Fuel material',
    kind: 'unavailable',
    group: 'unsupported',
    reason: 'Material properties and validated applicability are unavailable.',
  },
]

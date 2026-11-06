import type { SimulationModel } from '@/types/simulation'
import { sceneCapabilities } from './sceneSettings'
import type { ParameterCapability } from './sceneSettings'
export type ModelParameterProfile = {
  modelId: string
  modelVersion: string
  parameters: ParameterCapability[]
}
export function modelParameterProfile(model: SimulationModel): ModelParameterProfile {
  const known = model.id === 'illustrative-field-sequence' && model.version === '1.0.0'
  return {
    modelId: model.id,
    modelVersion: model.version,
    parameters: known
      ? sceneCapabilities
      : [
          ...sceneCapabilities.filter((p) => p.group === 'visualization'),
          {
            id: 'unpublished',
            label: 'Scientific conditions',
            kind: 'unavailable',
            group: 'unsupported',
            reason: 'No scientific parameter schema is published for this model version.',
          },
        ],
  }
}

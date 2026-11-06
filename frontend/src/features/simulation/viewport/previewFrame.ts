import type { SimulationFrame } from '@/types/simulation'
export const previewFrame: SimulationFrame = {
  id: 'scene-preview',
  runId: '',
  revisionId: '',
  modelVersion: '1.0.0',
  coordinate: { value: 0, unit: 'step' },
  field: {
    id: 'preview',
    label: 'Illustrative',
    unit: 'dimensionless',
    domain: [0, 1],
    spatialRank: 3,
    coordinateUnit: 'unspecified',
  },
  measurements: [],
}

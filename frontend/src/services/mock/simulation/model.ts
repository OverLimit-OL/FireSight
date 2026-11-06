import type { SimulationModel } from '@/types/simulation'
export const illustrativeModel: SimulationModel = {
  id: 'illustrative-field-sequence',
  version: '1.0.0',
  title: 'Scalar field sequence',
  description:
    'Inspect a small, preauthored spatial field. This exercises research workflows without a physics engine.',
  origin: 'illustrative',
  capabilities: {
    spatialRank: 3,
    canRun: true,
    canCancel: true,
    views: ['slice', 'points', 'table'],
  },
  validation: { status: 'unverified', evidence: [], scope: null },
  inputs: [
    {
      id: 'sequenceId',
      label: 'Fixture sequence',
      options: [
        { value: 'reference', label: 'Reference sequence' },
        { value: 'offset', label: 'Offset sequence' },
      ],
    },
  ],
  defaults: { sequenceId: 'reference' },
  provenance: [
    {
      id: 'firesight-fixture-v1',
      title: 'Fire-XII authored example · not NASA data',
      url: null,
      origin: 'illustrative',
      revision: '1',
    },
  ],
  limitations: [
    'No combustion equations or physical predictions.',
    'Values, coordinates and steps are dimensionless.',
    'One sample is intentionally missing at step 4.',
    'The two sequences are preauthored fixtures, not recomputed physical scenarios.',
  ],
}

export const apparatus = [
  {
    id: 'sample',
    name: 'Solid fuel sample',
    role: 'Schematic solid specimen held in the test region. Material and dimensions are unspecified.',
    position: [0, 0, 0],
  },
  {
    id: 'chamber',
    name: 'Test enclosure',
    role: 'Cutaway flow tunnel illustrating containment and optical access. Not a historical reconstruction.',
    position: [0, 0.4, 0],
  },
  {
    id: 'holder',
    name: 'Sample support',
    role: 'Illustrative mounting assembly. No thermal or mechanical properties are assigned.',
    position: [0, -0.8, 0],
  },
  {
    id: 'inlet',
    name: 'Flow inlet',
    role: 'Indicates a conceptual flow direction. Velocity, oxygen fraction and pressure are not connected.',
    position: [-2.3, 0.3, 0],
  },
  {
    id: 'camera',
    name: 'Optical observation',
    role: 'Schematic camera for visual observation. No source imagery or calibrated measurements are connected.',
    position: [1.8, -0.15, 1],
  },
  {
    id: 'flame',
    name: 'Combustion region',
    role: 'Authored illustrative envelope, indexed by playback step. Not computed fluid dynamics or a temperature field.',
    position: [0, 0.65, 0],
  },
] as const
export type ComponentId = (typeof apparatus)[number]['id']
export const componentById = (id: string) => apparatus.find((c) => c.id === id)

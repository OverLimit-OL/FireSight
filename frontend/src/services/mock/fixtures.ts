import type {
  Dataset,
  DatasetRow,
  EvidenceReference,
  ResearchContext,
  ResearchStudy,
  SourceReference,
  ChatMessage,
} from '@/types/research'

const nasa =
  'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/'
function source(id: string, title: string, url = nasa): SourceReference {
  return {
    id,
    title,
    url,
    type: 'agency-page',
    publisher: 'NASA',
    publishedAt: null,
    retrievedAt: null,
    locator: 'Investigation overview',
  }
}
function study(
  id: string,
  investigation: string,
  title: string,
  category: string,
  objective: string,
  reference: SourceReference,
): ResearchStudy {
  return {
    id,
    investigation,
    title,
    category,
    objective,
    description: objective,
    recordLevel: 'investigation',
    environment: 'Microgravity',
    conditions: [],
    materials: [],
    instruments: [],
    measurementTypes: [],
    datasetIds: [],
    datasetsAvailability: 'not-connected',
    sources: [reference],
    relatedStudyIds: [],
    fieldLimitations: {
      measurements: 'Numerical measurements have not been connected to this workspace.',
      findings: 'This record describes a research objective, not an experimental result.',
    },
  }
}
// High-level paraphrases only. Source register: docs/SOURCES.md. No numerical NASA data.
export const studies: ResearchStudy[] = [
  study(
    'bass',
    'BASS',
    'Burning and Suppression of Solids',
    'Solid-fuel combustion',
    'Examines how a variety of solid fuel samples burn and extinguish in microgravity.',
    source('nasa-bass', 'NASA Glenn · Combustion Science'),
  ),
  study(
    'bass-ii',
    'BASS-II',
    'Burning and Suppression of Solids II',
    'Solid-fuel combustion',
    'Studies ignition, flame growth, spread and extinction of solid fuels in low-velocity microgravity flows.',
    source(
      'nasa-bass-ii',
      'NASA Physical Sciences Informatics · BASS-II',
      'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    ),
  ),
  study(
    'flex',
    'FLEX',
    'Flame Extinguishment Experiment',
    'Fire suppression',
    'Investigates the effectiveness of inert-gas fire suppressants in microgravity.',
    source('nasa-flex', 'NASA Glenn · Combustion Science'),
  ),
  study(
    'same',
    'SAME',
    'Smoke Aerosol Measurement Experiment',
    'Smoke detection',
    'Characterizes smoke particles to inform spacecraft smoke detection research.',
    source(
      'nasa-same',
      'NASA · Smoke Aerosol Measurement Experiment',
      'https://www.nasa.gov/wp-content/uploads/2025/07/smoke-aerosol-measurement-experiment-same.pdf',
    ),
  ),
  study(
    'saffire',
    'Saffire',
    'Spacecraft Fire Safety Demonstration',
    'Spacecraft fire safety',
    'Investigates spacecraft fire behavior through experiments aboard an uncrewed Cygnus vehicle.',
    source(
      'nasa-saffire',
      'NASA PSI · Saffire-I',
      'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
    ),
  ),
]
studies.forEach((s) => {
  s.relatedStudyIds = studies
    .filter((other) => other.id !== s.id && other.category === s.category)
    .map((other) => other.id)
})
export const suggestedQuestions = [
  {
    title: 'What do BASS and BASS-II investigate?',
    detail: 'Explore solid-fuel combustion',
    studyIds: ['bass', 'bass-ii'],
  },
  {
    title: 'How does FLEX approach fire suppression?',
    detail: 'Start from the investigation objective',
    studyIds: ['flex'],
  },
  {
    title: 'What evidence is needed to compare studies?',
    detail: 'Build a traceable research workflow',
    studyIds: [],
  },
]
export function demoResponse(context: ResearchContext): ChatMessage {
  const selected = context.studyIds
    .map((id) => studies.find((s) => s.id === id))
    .filter((s): s is ResearchStudy => Boolean(s))
  const refs = selected.length ? selected : [studies[0], studies[2]]
  const evidence: EvidenceReference[] = refs.map((s) => ({
    id: `evidence-${s.id}`,
    classification: 'interpretation',
    studyId: s.id,
    experimentName: s.investigation,
    source: s.sources[0],
    passage: s.objective,
    passageKind: 'paraphrase',
    measurement: null,
    studySectionId: 'objective',
    provenanceStatus: 'partial',
    uncertainty: null,
    limitations: [
      'This source supports an investigation description, not a measured outcome. No numerical measurements are connected.',
    ],
  }))
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    generation: 'scripted-demo',
    createdAt: new Date().toISOString(),
    status: 'complete',
    studyIds: refs.map((s) => s.id),
    attachments: [],
    context,
    evidence,
    markdown: `## Begin with the investigation, then follow the evidence\n\nThis is a **scripted demonstration**, not an AI-generated answer to your question. It shows how study context, sources and the Lab connect. File contents have not been read.\n\n${refs.map((s) => `- **${s.investigation}** — ${s.objective}`).join('\n')}\n\n### What can be established here?\n\nThese source-backed descriptions identify research objectives. They do not establish experimental findings, quantitative comparisons, or safety recommendations. Open the evidence records below to inspect their provenance.\n\n${context.labSnapshot ? `Your **${context.labSnapshot.datasets.some((d) => d.origin === 'synthetic') ? 'synthetic demonstration' : 'saved'} Lab view** is attached, including the selected variables and samples. It is a context snapshot, not a validated physical model.\n\n` : ''}### A useful next step\n\nRead the original source, check whether compatible measurements are available, and retain the experimental conditions alongside any comparison. You can carry these study references into the Lab; missing measurements will remain explicitly unavailable.`,
  }
}
export const syntheticDataset: Dataset = {
  id: 'synthetic-traces',
  studyId: null,
  title: 'Illustrative signal traces',
  revision: 'demo-v1',
  origin: 'synthetic',
  availability: 'available',
  variables: [
    {
      id: 'index',
      label: 'Sample index',
      kind: 'number',
      quantity: null,
      unit: 'dimensionless',
      role: 'independent',
      reportedPrecision: 0,
      description: 'Ordered synthetic sample index',
    },
    ...['a', 'b'].map((id) => ({
      id,
      label: `Example signal ${id.toUpperCase()}`,
      kind: 'number' as const,
      quantity: null,
      unit: 'dimensionless',
      role: 'dependent' as const,
      reportedPrecision: 2,
      description: 'Generated signal with no physical interpretation',
    })),
  ],
  source: null,
  conditions: [],
  limitations: [
    'Synthetic demonstration. No physical interpretation. Unrelated to NASA measurements.',
  ],
}
export const syntheticRows: DatasetRow[] = Array.from({ length: 24 }, (_, i) => ({
  id: `sample-${i + 1}`,
  values: {
    index: i + 1,
    a: i === 10 ? null : Number((0.45 + Math.sin(i * 0.24) * 0.24 + i * 0.006).toFixed(2)),
    b: Number((0.34 + Math.sin(i * 0.24 + 0.7) * 0.15 + i * 0.01).toFixed(2)),
  },
}))

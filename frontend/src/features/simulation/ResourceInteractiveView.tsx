import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpen } from 'lucide-react'
import { simulationApi } from '@/services/simulation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorState, ExternalLink, Loading } from '@/components/shared'
import type { ResourceSimulationPreview } from '@/types/simulation'
import ExperimentViewport from './viewport/ExperimentViewport'
import TwoDimensionalView from './viewport/TwoDimensionalView'
import { useState } from 'react'
export default function ResourceInteractiveView({ studyId }: { studyId: string }) {
  const [params] = useSearchParams()
  const [component, setComponent] = useState<string>(() => params.get('component') ?? 'sample')
  const [view, setView] = useState<'slice' | 'points'>(() =>
    params.get('scene') === 'slice' ? 'slice' : 'points',
  )
  const returnLab = params.get('lab')
  const fullLabTarget = returnLab
    ? `/lab/studio/${encodeURIComponent(returnLab)}?entity=${encodeURIComponent(component)}&view=${view}${params.get('run') ? `&run=${encodeURIComponent(params.get('run')!)}` : ''}${params.get('frame') ? `&frame=${encodeURIComponent(params.get('frame')!)}` : ''}`
    : `/lab/new?study=${encodeURIComponent(studyId)}&component=${encodeURIComponent(component)}&view=${view}`
  const preview = useQuery({
    queryKey: [simulationApi.mode, 'resource-simulation', studyId],
    queryFn: ({ signal }) => simulationApi.getResourcePreview(studyId, signal),
  })
  return (
    <section id="interactive" className="detail-section resource-interactive">
      <p className="eyebrow">From evidence to exploration</p>
      <h2>Interactive Experiment View</h2>
      {preview.isPending ? (
        <Loading label="Checking visualization availability…" />
      ) : preview.isError ? (
        <ErrorState error={preview.error} retry={() => preview.refetch()} />
      ) : preview.data.status === 'available' ? (
        <AvailablePreview preview={preview.data} />
      ) : (
        <>
          {studyId === 'bass' ? (
            <div className="resource-schematic-preview">
              <p className="eyebrow">Illustrative study companion · not recorded data</p>
              <ExperimentViewport
                variant="embedded"
                selected={component}
                onSelect={setComponent}
                mode={view}
                onMode={setView}
              />
              <p>
                BASS-II used a flow tunnel within the Microgravity Science Glovebox. This schematic
                conveys that concept; apparatus dimensions and flame geometry are not reconstructed.
              </p>
              <ExternalLink url="https://ntrs.nasa.gov/citations/20160000593">
                NASA BASS-II research record
              </ExternalLink>
              <div className="detail-actions">
                <Button asChild>
                  <Link to={fullLabTarget}>Open in full Lab</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to={`/?study=bass&question=${encodeURIComponent(`Explain the ${component} in the BASS-inspired illustrative scene and distinguish source evidence from schematic details.`)}`}
                  >
                    Ask about {component}
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
          <div className="unavailable-block">
            <BookOpen aria-hidden="true" />
            <div>
              <strong>Reconstruction data not connected</strong>
              <p>{preview.data.reason}</p>
            </div>
          </div>
          <div className="detail-actions">
            <Button asChild variant="outline">
              <Link to={`/lab/new?study=${encodeURIComponent(studyId)}`}>
                Explore available models
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link
                to={`/?study=${encodeURIComponent(studyId)}&question=${encodeURIComponent('What evidence is missing for an interactive reconstruction of this investigation?')}`}
              >
                Ask about missing evidence
              </Link>
            </Button>
          </div>
          <p className="muted">
            A demonstration can retain this study as a reference. It does not recreate the
            experiment.
          </p>
        </>
      )}
    </section>
  )
}
function AvailablePreview({
  preview,
}: {
  preview: Extract<ResourceSimulationPreview, { status: 'available' }>
}) {
  const [selected, setSelected] = useState('p-111')
  const frames = useQuery({
    queryKey: [simulationApi.mode, 'resource-preview-frames', preview.runId],
    queryFn: ({ signal }) => simulationApi.getFrames(preview.runId, signal),
  })
  const frame = frames.data?.find((f) => f.id === preview.frameId)
  const target = `/lab/studio/${encodeURIComponent(preview.sessionId)}?run=${encodeURIComponent(preview.runId)}&frame=${encodeURIComponent(preview.frameId)}&entity=${encodeURIComponent(selected)}`
  return (
    <>
      <Badge variant="outline">
        {preview.source.origin === 'recorded'
          ? 'Recorded Experiment'
          : 'Illustrative / Not Scientifically Validated'}
      </Badge>
      {frames.isPending ? (
        <Loading label="Loading recorded view…" />
      ) : frames.isError ? (
        <ErrorState error={frames.error} />
      ) : frame ? (
        <TwoDimensionalView frame={frame} selectedId={selected} onSelect={setSelected} />
      ) : (
        <p className="missing-field">
          The referenced frame is unavailable. No reconstruction was substituted.
        </p>
      )}
      <ExternalLink url={preview.source.url}>{preview.source.title}</ExternalLink>
      <Button asChild variant="outline">
        <Link to={target}>
          Open Full Lab
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </>
  )
}

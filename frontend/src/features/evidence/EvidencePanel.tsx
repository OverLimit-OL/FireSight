import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CircleHelp, FileText, Fingerprint } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink } from '@/components/shared'
import type { EvidenceReference } from '@/types/research'

export default function EvidencePanel({
  evidence,
  requested,
  close,
}: {
  evidence: EvidenceReference | undefined
  requested: boolean
  close: () => void
}) {
  const trigger = useRef(document.activeElement as HTMLElement | null)
  return (
    <Sheet
      open={requested}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <SheetContent
        className="evidence-sheet"
        onCloseAutoFocus={(e) => {
          if (trigger.current?.isConnected) {
            e.preventDefault()
            trigger.current.focus()
          }
        }}
      >
        <SheetHeader>
          <div className="eyebrow">
            <Fingerprint aria-hidden="true" />
            Research provenance
          </div>
          <SheetTitle>Follow the evidence</SheetTitle>
          <SheetDescription>
            Inspect what this source supports and where its limits begin.
          </SheetDescription>
        </SheetHeader>
        {evidence ? (
          <div className="evidence-body">
            <Badge variant="outline" className="classification">
              {evidence.classification}
            </Badge>
            <section>
              <h3>Supporting passage</h3>
              <p className="evidence-passage">
                {evidence.passage ?? 'No supporting passage or measurement is attached.'}
              </p>
              <span className="small-label">
                {evidence.passageKind === 'paraphrase'
                  ? 'Attributed paraphrase · not a direct quotation'
                  : evidence.passageKind === 'quote'
                    ? 'Quoted source passage'
                    : 'Supporting passage unavailable'}
              </span>
            </section>
            <Separator />
            <section>
              <h3>Source record</h3>
              <dl className="metadata-list">
                <div>
                  <dt>Title</dt>
                  <dd>{evidence.source?.title ?? 'Source provenance unavailable'}</dd>
                </div>
                <div>
                  <dt>Investigation</dt>
                  <dd>{evidence.experimentName ?? 'Not reported'}</dd>
                </div>
                <div>
                  <dt>Source type</dt>
                  <dd>{evidence.source?.type.replaceAll('-', ' ') ?? 'Not reported'}</dd>
                </div>
                <div>
                  <dt>Locator</dt>
                  <dd>{evidence.source?.locator ?? 'Specific locator unavailable'}</dd>
                </div>
                <div>
                  <dt>Provenance</dt>
                  <dd>
                    {evidence.provenanceStatus === 'partial'
                      ? 'Partial · overview source only'
                      : evidence.provenanceStatus}
                  </dd>
                </div>
                <div>
                  <dt>Uncertainty</dt>
                  <dd>{evidence.uncertainty?.description ?? 'Uncertainty not reported'}</dd>
                </div>
                {evidence.uncertainty?.confidence ? (
                  <div>
                    <dt>Supplied confidence</dt>
                    <dd>
                      {new Intl.NumberFormat('en', { style: 'percent' }).format(
                        evidence.uncertainty.confidence.value,
                      )}{' '}
                      · {evidence.uncertainty.confidence.method}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
            <Alert>
              <CircleHelp aria-hidden="true" />
              <AlertDescription>
                {evidence.limitations.join(' ') ||
                  'Review the source scope before drawing conclusions.'}
              </AlertDescription>
            </Alert>
            <div className="evidence-actions">
              <ExternalLink url={evidence.source?.url ?? null}>Open original source</ExternalLink>
              {evidence.studyId ? (
                <Button variant="outline" asChild>
                  <Link
                    to={`/resources/${evidence.studyId}#${evidence.studySectionId ?? 'sources'}`}
                    onClick={close}
                  >
                    <BookOpen data-icon="inline-start" />
                    Open related study
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="evidence-body">
            <FileText aria-hidden="true" />
            <h3>No supporting source attached</h3>
            <p>
              This evidence record is unavailable. A conclusion cannot be traced from this view.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

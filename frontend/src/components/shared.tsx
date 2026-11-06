import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, FileSearch, LoaderCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from '@/components/ui/empty'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { APIError } from '@/types/research'

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeOpacity=".5" />
      <path d="M10 23V9h13M10 15h10M16 9v14" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="22" cy="23" r="2" fill="currentColor" />
    </svg>
  )
}
export function Loading({ label = 'Loading workspace…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span>{label}</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>
        {error instanceof APIError && error.code === 'NOT_FOUND'
          ? 'This record is unavailable'
          : 'Could not complete this request'}
      </AlertTitle>
      <AlertDescription>
        <p>
          {error instanceof Error ? error.message : 'An unexpected error occurred. Please retry.'}
        </p>
        <div className="actions">
          {retry ? (
            <Button variant="outline" onClick={retry}>
              <RotateCcw data-icon="inline-start" />
              Retry
            </Button>
          ) : null}
          <Button variant="ghost" asChild>
            <Link to="/">Return to workspace</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearch aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          <h2>{title}</h2>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  )
}
export function ExternalLink({ url, children }: { url: string | null; children: ReactNode }) {
  if (!url || !/^https?:\/\//i.test(url))
    return <span className="muted">Original source link unavailable</span>
  return (
    <a className="text-link" href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
export function ConfirmAction({
  trigger,
  title,
  description,
  actionLabel,
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  description: string
  actionLabel: string
  onConfirm: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setOpen(value)
          setError('')
        }
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="error-text">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await onConfirm()
                setOpen(false)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not finish. Retry.')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? <LoaderCircle className="spinner" data-icon="inline-start" /> : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
export function PageHeading({
  label,
  title,
  description,
  action,
}: {
  label: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h1 tabIndex={-1}>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  )
}

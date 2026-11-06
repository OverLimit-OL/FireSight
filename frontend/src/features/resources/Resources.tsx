import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Database, GitCompareArrows, Search, X } from 'lucide-react'
import { useStudies } from '@/hooks/useResearch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { EmptyState, ErrorState, Loading, PageHeading } from '@/components/shared'

export default function Resources() {
  const collection = useStudies()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const investigation = params.get('investigation') ?? 'all'
  const availability = params.get('availability') ?? 'all'
  const sort = params.get('sort') ?? 'asc'
  const selected = params.get('compare')?.split(',').filter(Boolean) ?? []
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: key === 'q' })
  }
  const studies = collection.data ?? []
  const visible = studies
    .filter(
      (s) =>
        `${s.title} ${s.investigation} ${s.description}`.toLowerCase().includes(q.toLowerCase()) &&
        (investigation === 'all' || s.investigation === investigation) &&
        (availability === 'all' || s.datasetsAvailability === availability),
    )
    .sort((a, b) => (sort === 'desc' ? -1 : 1) * a.title.localeCompare(b.title))
  const compared = selected
    .map((id) => studies.find((s) => s.id === id))
    .filter((s) => s !== undefined)
  return (
    <div className="page resources-page">
      <PageHeading
        label="Research collection"
        title="The investigation library"
        description="A source-linked index of microgravity combustion research."
        action={
          <span className="page-heading-icon">
            <BookOpen aria-hidden="true" />
          </span>
        }
      />
      <div className="library-status">
        <Database aria-hidden="true" />
        <div>
          <strong>Investigation overviews</strong>
          <span>Original sources are linked. Experimental measurements are not connected.</span>
        </div>
      </div>
      <FieldGroup className="resource-filters">
        <Field className="search-field">
          <FieldLabel htmlFor="resource-search">Search research</FieldLabel>
          <div className="search-control">
            <Search aria-hidden="true" />
            <Input
              id="resource-search"
              name="resourceSearch"
              autoComplete="off"
              placeholder="Search investigations or research objectives…"
              value={q}
              onChange={(e) => update('q', e.target.value)}
            />
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="investigation-filter">Investigation</FieldLabel>
          <NativeSelect
            id="investigation-filter"
            value={investigation}
            onChange={(e) => update('investigation', e.target.value)}
          >
            <NativeSelectOption value="all">All investigations</NativeSelectOption>
            {studies.map((s) => (
              <NativeSelectOption value={s.investigation} key={s.id}>
                {s.investigation}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="availability-filter">Measurements</FieldLabel>
          <NativeSelect
            id="availability-filter"
            value={availability}
            onChange={(e) => update('availability', e.target.value)}
          >
            <NativeSelectOption value="all">All availability</NativeSelectOption>
            <NativeSelectOption value="available">Connected</NativeSelectOption>
            <NativeSelectOption value="not-connected">Not connected</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="resource-sort">Sort by</FieldLabel>
          <NativeSelect
            id="resource-sort"
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
          >
            <NativeSelectOption value="asc">Title A–Z</NativeSelectOption>
            <NativeSelectOption value="desc">Title Z–A</NativeSelectOption>
          </NativeSelect>
        </Field>
      </FieldGroup>
      <div className="result-toolbar">
        <span role="status">
          {collection.isSuccess
            ? `${visible.length} ${visible.length === 1 ? 'investigation' : 'investigations'}`
            : 'Research index'}
        </span>
        {q || investigation !== 'all' || availability !== 'all' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new URLSearchParams()
              if (selected.length) next.set('compare', selected.join(','))
              setParams(next)
            }}
          >
            <X data-icon="inline-start" />
            Clear filters
          </Button>
        ) : (
          <span>Select up to 3 to compare metadata</span>
        )}
      </div>
      {collection.isPending ? (
        <Loading label="Loading research index…" />
      ) : collection.isError ? (
        <ErrorState error={collection.error} retry={() => collection.refetch()} />
      ) : !visible.length ? (
        <EmptyState
          title="No investigations match"
          description="Try a broader search or clear the measurement and investigation filters."
        >
          <Button variant="outline" onClick={() => setParams({})}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="study-list">
          {visible.map((s) => (
            <li className="study-row" key={s.id}>
              <label className="compare-checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  disabled={!selected.includes(s.id) && selected.length >= 3}
                  aria-label={`Compare ${s.investigation}`}
                  onChange={() =>
                    update(
                      'compare',
                      (selected.includes(s.id)
                        ? selected.filter((id) => id !== s.id)
                        : [...selected, s.id]
                      ).join(','),
                    )
                  }
                />
              </label>
              <div className="study-code">
                <span>{s.investigation}</span>
                <small>{s.category}</small>
              </div>
              <Link to={`/resources/${s.id}`} className="study-main">
                <h2>
                  {s.title}
                  <ArrowRight aria-hidden="true" />
                </h2>
                <p>{s.objective}</p>
                <div className="study-meta">
                  <span>{s.environment ?? 'Environment not reported'}</span>
                  <span>NASA source</span>
                </div>
              </Link>
              <div className="study-availability">
                <span className="outline-dot" />
                Measurements not connected
              </div>
            </li>
          ))}
        </ul>
      )}
      {selected.length ? (
        <div className="comparison-bar">
          <div>
            <GitCompareArrows aria-hidden="true" />
            <strong>{selected.length} selected</strong>
            <span>{compared.map((s) => s.investigation).join(' / ')}</span>
          </div>
          <div className="actions">
            <Button
              variant="ghost"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('compare')
                next.delete('comparison')
                setParams(next)
              }}
            >
              Clear
            </Button>
            <Button disabled={selected.length < 2} onClick={() => update('comparison', '1')}>
              Compare studies
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}
      <Dialog
        open={params.get('comparison') === '1'}
        onOpenChange={(open) => {
          if (!open) update('comparison', '')
        }}
      >
        <DialogContent className="comparison-dialog">
          <DialogHeader>
            <DialogTitle>Compare investigation context</DialogTitle>
            <DialogDescription>
              Metadata comparison only. No compatible experimental measurements are connected.
            </DialogDescription>
          </DialogHeader>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                Selected investigation metadata; quantitative comparison unavailable
              </caption>
              <thead>
                <tr>
                  <th scope="col">Research context</th>
                  {compared.map((s) => (
                    <th scope="col" key={s.id}>
                      {s.investigation}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Objective</th>
                  {compared.map((s) => (
                    <td key={s.id}>{s.objective}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Environment</th>
                  {compared.map((s) => (
                    <td key={s.id}>{s.environment}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Measurements</th>
                  {compared.map((s) => (
                    <td key={s.id}>Not connected</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Source</th>
                  {compared.map((s) => (
                    <td key={s.id}>
                      <Link to={`/resources/${s.id}#sources`} className="text-link">
                        Open study
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted">
            A numerical overlay requires documented variables, compatible units and experimental
            conditions. Investigation names alone do not establish comparability.
          </p>
          {compared.length < selected.length ? (
            <p role="status">Some selected records are unavailable in the current collection.</p>
          ) : null}
        </DialogContent>
      </Dialog>
      <div className="library-footnote">
        <FingerprintIcon />
        <span>
          Descriptions summarize investigation objectives. They are not experimental findings or
          safety recommendations.
        </span>
      </div>
    </div>
  )
}
function FingerprintIcon() {
  return <BookOpen aria-hidden="true" />
}

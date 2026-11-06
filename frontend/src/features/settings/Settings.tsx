import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Info, Monitor, Trash2 } from 'lucide-react'
import { usePreferences } from '@/app/Preferences'
import { api, keys, refreshConversations } from '@/app/data'
import { CONVERSATIONS_KEY } from '@/services/mock/MockResearchApi'
import { resetStored } from '@/lib/storage'
import { APIError } from '@/types/research'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfirmAction, PageHeading } from '@/components/shared'
function Preference({
  label,
  description,
  value,
  options,
  change,
}: {
  label: string
  description: string
  value: string
  options: [string, string][]
  change: (v: string) => void
}) {
  const id = label.toLowerCase().replaceAll(' ', '-')
  return (
    <Field orientation="horizontal" className="setting-row">
      <div>
        <FieldLabel id={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <ToggleGroup
        type="single"
        aria-labelledby={id}
        value={value}
        onValueChange={(v) => {
          if (v) change(v)
        }}
      >
        {options.map(([v, text]) => (
          <ToggleGroupItem key={v} value={v}>
            {text}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}
export default function Settings() {
  const { prefs, update } = usePreferences()
  const history = useQuery({ queryKey: keys.conversations, queryFn: () => api.listConversations() })
  return (
    <div className="page settings-page">
      <PageHeading
        label="Make room for your workflow"
        title="Workspace settings"
        description="Considered preferences. Stored on this device."
        action={
          <span className="page-heading-icon">
            <Monitor aria-hidden="true" />
          </span>
        }
      />
      <section className="settings-section">
        <h2>Appearance</h2>
        <FieldGroup>
          <Preference
            label="Color theme"
            description="Choose a canvas, or follow your system."
            value={prefs.theme}
            options={[
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'System'],
            ]}
            change={(v) => {
              if (v === 'light' || v === 'dark' || v === 'system') update({ theme: v })
            }}
          />
          <Preference
            label="Interface density"
            description="Compact spacing keeps reading text at its original size."
            value={prefs.density}
            options={[
              ['comfortable', 'Comfortable'],
              ['compact', 'Compact'],
            ]}
            change={(v) => {
              if (v === 'comfortable' || v === 'compact') update({ density: v })
            }}
          />
          <Preference
            label="Motion"
            description="System reduced-motion settings always take precedence."
            value={prefs.motion}
            options={[
              ['system', 'Follow system'],
              ['reduce', 'Reduce motion'],
            ]}
            change={(v) => {
              if (v === 'system' || v === 'reduce') update({ motion: v })
            }}
          />
        </FieldGroup>
      </section>
      <section className="settings-section">
        <h2>Research preferences</h2>
        <FieldGroup>
          <Preference
            label="Evidence presentation"
            description="Source limitations remain visible in either view."
            value={prefs.citations}
            options={[
              ['inline', 'Inline markers'],
              ['expanded', 'Expanded sources'],
            ]}
            change={(v) => {
              if (v === 'inline' || v === 'expanded') update({ citations: v })
            }}
          />
        </FieldGroup>
      </section>
      <section className="settings-section">
        <h2>Conversation history</h2>
        <div className="setting-row">
          <div>
            <h3>
              {history.data
                ? `${history.data.length} saved conversations`
                : 'History status unavailable'}
            </h3>
            <p className="muted">
              Stored in the selected mode. Lab workspaces and preferences are separate.
            </p>
          </div>
          <ConfirmAction
            title="Delete all conversations?"
            description="This removes conversation history. Saved Lab workspaces and preferences are retained. This cannot be undone."
            actionLabel="Delete conversations"
            trigger={
              <Button variant="outline" disabled={!history.data?.length}>
                <Trash2 data-icon="inline-start" />
                Delete history…
              </Button>
            }
            onConfirm={async () => {
              try {
                for (const c of history.data ?? []) await api.deleteConversation(c.id, c.revision)
              } finally {
                await refreshConversations()
              }
            }}
          />
        </div>
        {api.mode === 'demo' &&
        history.error instanceof APIError &&
        history.error.code === 'STORAGE_ERROR' ? (
          <ConfirmAction
            title="Reset unreadable history?"
            description="This removes only unreadable local conversation storage. Lab sessions and preferences are retained."
            actionLabel="Reset unreadable history"
            trigger={<Button variant="destructive">Reset unreadable history…</Button>}
            onConfirm={async () => {
              resetStored(CONVERSATIONS_KEY)
              await refreshConversations()
            }}
          />
        ) : null}
      </section>
      {api.mode === 'demo' ? (
        <section className="settings-section">
          <h2>Demonstration controls</h2>
          <FieldGroup>
            <Field orientation="horizontal" className="setting-row">
              <div>
                <FieldLabel htmlFor="demo-scenario">Demo scenario</FieldLabel>
                <FieldDescription>
                  Exercise library and response states without changing saved research.
                </FieldDescription>
              </div>
              <NativeSelect
                id="demo-scenario"
                value={prefs.scenario}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'normal' || v === 'empty' || v === 'error') update({ scenario: v })
                }}
              >
                <NativeSelectOption value="normal">Normal demonstration</NativeSelectOption>
                <NativeSelectOption value="empty">Empty results</NativeSelectOption>
                <NativeSelectOption value="error">Simulated error</NativeSelectOption>
              </NativeSelect>
            </Field>
          </FieldGroup>
          <Alert>
            <Info aria-hidden="true" />
            <AlertDescription>
              Responses are deterministic scripts. Attachments stay local and are not processed.
              Synthetic Lab signals have no physical interpretation.
            </AlertDescription>
          </Alert>
        </section>
      ) : null}
      <div className="settings-about">
        <strong>
          Fire-XII<span className="brand-period">.</span>
        </strong>
        <p>
          Independent scientific research prototype.
          <br />
          Not an official NASA product. No validated predictive model is connected.
        </p>
        <Link className="text-link" to="/resources">
          Explore source provenance
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

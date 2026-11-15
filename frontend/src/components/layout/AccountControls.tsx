import { Link } from 'react-router-dom'
import { useState } from 'react'
import { KeyRound, ExternalLink, Eye, EyeOff, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function AccountControls() {
  const [open, setOpen] = useState(new URLSearchParams(location.search).has('configure'))
  const [key, setKey] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  function changeOpen(value: boolean) {
    setOpen(value)
    if (!value) {
      setKey('')
      const url = new URL(location.href)
      url.searchParams.delete('configure')
      history.replaceState(null, '', url)
    }
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSaved(false)
          setOpen(true)
        }}
      >
        <KeyRound /> Gemini setup
      </Button>
      <form action="/auth/logout" method="post">
        <Button variant="ghost" size="icon-sm" aria-label="Sign out">
          <LogOut />
        </Button>
      </form>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="gemini-onboarding">
          <DialogHeader>
            <span className="setup-symbol">
              <KeyRound />
            </span>
            <DialogTitle>
              {saved ? 'You’re ready to research' : 'Connect your research assistant'}
            </DialogTitle>
            <DialogDescription>
              {saved
                ? 'Your Gemini key has been saved securely to your account.'
                : 'Bring your Gemini API key to ask questions about studies, documents and your experiment.'}
            </DialogDescription>
          </DialogHeader>
          <Link className="text-link" to="/guide" onClick={() => changeOpen(false)}>
            New here? Explore the workspace guide
          </Link>
          {saved ? (
            <Button asChild>
              <Link to="/guide" onClick={() => changeOpen(false)}>
                Explore the feature guide
              </Link>
            </Button>
          ) : (
            <>
              <div className="setup-guide">
                <strong>Get a key from Google AI Studio</strong>
                <p>
                  Sign in with Google, choose Create API key, then select a project. Review Google’s
                  usage limits and billing settings.
                </p>
                <a
                  className="text-link"
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Google AI Studio <ExternalLink size={14} />
                </a>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setBusy(true)
                  setError('')
                  try {
                    const body = new FormData()
                    body.set('key', key)
                    body.set('embedded', '1')
                    const response = await fetch('/setup', { method: 'POST', body })
                    if (!response.ok) throw new Error('Check your key and try saving again.')
                    setKey('')
                    setSaved(true)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not save your key.')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <label htmlFor="gemini-key">Gemini API key</label>
                <div className="setup-key-input">
                  <Input
                    id="gemini-key"
                    type={visible ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    autoComplete="off"
                    minLength={20}
                    maxLength={300}
                    required
                    placeholder="Paste your API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={visible ? 'Hide API key' : 'Show API key'}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <p className="setup-privacy">
                  Your key is encrypted on the server. Questions and relevant research context are
                  sent to Google when you use the assistant.
                </p>
                {error && (
                  <p role="alert" className="error-text">
                    {error}
                  </p>
                )}
                <div className="setup-actions">
                  <Button
                    variant="ghost"
                    type="button"
                    disabled={busy}
                    onClick={() => changeOpen(false)}
                  >
                    Set up later
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Saving…' : 'Save & continue'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigationType,
  useNavigate,
} from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  Home,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sun,
  Trash2,
} from 'lucide-react'
import { api, keys, refreshConversations, queryClient } from '@/app/data'
import { usePreferences } from '@/app/Preferences'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from '@/components/ui/sheet'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { BrandMark, ConfirmAction } from '@/components/shared'
import type { Conversation } from '@/types/research'

const navigation = [
  { to: '/', label: 'Research workspace', icon: Home },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/lab', label: 'Lab', icon: FlaskConical },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]
function Rename({ conversation }: { conversation: Conversation }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(conversation.title)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        setName(conversation.title)
        setError('')
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Rename ${conversation.title}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename conversation</DialogTitle>
          <DialogDescription>
            Choose a recognizable title for your research history.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim() || name.trim().length > 120) {
              setError('Use 1–120 characters.')
              return
            }
            setBusy(true)
            try {
              await api.renameConversation(conversation.id, name, conversation.revision)
              await refreshConversations()
              setOpen(false)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Rename failed.')
            } finally {
              setBusy(false)
            }
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="conversation-name">Conversation title</FieldLabel>
              <Input
                id="conversation-name"
                name="conversationTitle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                aria-invalid={!!error}
              />
              {error ? (
                <p role="alert" className="error-text">
                  {error}
                </p>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? 'Saving…' : 'Save title'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Sidebar({ close, mobile = false }: { close?: () => void; mobile?: boolean }) {
  const { prefs, update } = usePreferences()
  const collapsed = prefs.collapsed && !mobile
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const history = useQuery({ queryKey: keys.conversations, queryFn: () => api.listConversations() })
  return (
    <div className={`sidebar-content ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <Link to="/" aria-label="FireSight home" onClick={close}>
          <BrandMark />
          {!collapsed ? (
            <span>
              FireSight<span className="brand-period">.</span>
            </span>
          ) : null}
        </Link>
        {!mobile ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => update({ collapsed: !prefs.collapsed })}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        ) : null}
      </div>
      <Button
        className="new-chat"
        variant="outline"
        onClick={() => {
          navigate('/?draft=' + crypto.randomUUID())
          close?.()
        }}
        title="New research chat"
      >
        <Plus data-icon="inline-start" />
        {!collapsed ? 'New research chat' : <span className="sr-only">New research chat</span>}
      </Button>
      <nav aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive || (item.to === '/' && location.pathname.startsWith('/chat/')) ? 'active' : ''}`
            }
            onClick={close}
            title={collapsed ? item.label : undefined}
          >
            <item.icon aria-hidden="true" />
            {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed ? (
        <>
          <Separator />
          <div className="history-heading">
            <span>Research history</span>
            <MessageSquare aria-hidden="true" />
          </div>
          <div className="history-search">
            <Search aria-hidden="true" />
            <Input
              aria-label="Search conversations"
              name="historySearch"
              autoComplete="off"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="history-list">
            {history.isPending ? (
              <p className="history-empty">Loading history…</p>
            ) : history.isError ? (
              <div className="history-empty">
                <p>History unavailable.</p>
                <Button variant="link" onClick={() => history.refetch()}>
                  Retry history
                </Button>
              </div>
            ) : (
              history.data
                .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <div className="history-row" key={c.id}>
                    <NavLink
                      to={`/chat/${c.id}`}
                      onClick={close}
                      className={({ isActive }) => (isActive ? 'selected' : '')}
                    >
                      <MessageSquare aria-hidden="true" />
                      <span>{c.title}</span>
                    </NavLink>
                    <div className="history-tools">
                      <Rename conversation={c} />
                      <ConfirmAction
                        title="Delete conversation?"
                        description={`“${c.title}” will be removed from ${api.mode === 'demo' ? 'this device' : 'the connected API'}. This cannot be undone.`}
                        actionLabel="Delete conversation"
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${c.title}`}>
                            <Trash2 />
                          </Button>
                        }
                        onConfirm={async () => {
                          await api.deleteConversation(c.id, c.revision)
                          await refreshConversations()
                          if (location.pathname === `/chat/${c.id}`) navigate('/')
                        }}
                      />
                    </div>
                  </div>
                ))
            )}
            {history.data &&
            !history.data.some((c) => c.title.toLowerCase().includes(search.toLowerCase())) ? (
              <p className="history-empty">
                {search
                  ? 'No conversations match.'
                  : 'Your research conversations will appear here.'}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="sidebar-foot">
        {!collapsed ? (
          <>
            <div className="small-label">
              <span className="status-square" />
              {api.mode === 'demo' ? 'Local demonstration' : 'Flask API mode'}
            </div>
            <p>
              {api.mode === 'demo'
                ? 'Your notebook stays on this device.'
                : 'Server requests only. No demo fallback.'}
            </p>
            <span className="independent">Independent research prototype</span>
          </>
        ) : (
          <span
            className="status-square"
            title={api.mode === 'demo' ? 'Local demo mode' : 'API mode'}
          />
        )}
      </div>
    </div>
  )
}
export default function Shell() {
  const { prefs, update, storageError } = usePreferences()
  const [mobile, setMobile] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigationType = useNavigationType()
  const lastRoute = useRef('')
  const section = location.pathname.startsWith('/resources')
    ? 'Resources'
    : location.pathname.startsWith('/lab')
      ? 'Lab'
      : location.pathname.startsWith('/settings')
        ? 'Settings'
        : 'Research workspace'
  useEffect(() => {
    document.title = `${section} · FireSight`
    if (lastRoute.current === location.pathname && !location.hash) return
    lastRoute.current = location.pathname
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
      return
    }
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
      const heading = document.querySelector<HTMLElement>('main h1')
      heading?.focus({ preventScroll: true })
    }
  }, [location.pathname, location.hash, section, navigationType])
  useEffect(() => {
    const listener = () => queryClient.invalidateQueries()
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [])
  return (
    <div
      className={`app-shell ${prefs.collapsed ? 'sidebar-collapsed' : ''} ${location.pathname.startsWith('/lab/studio/') ? 'is-workstation' : ''}`}
    >
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <aside className="desktop-sidebar">
        <Sidebar />
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent
          side="left"
          className="mobile-navigation"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            menuTrigger.current?.focus()
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Workspace sections and research history.</SheetDescription>
          </SheetHeader>
          <Sidebar mobile close={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
      <div className="app-body">
        <header className="app-header">
          <div className="header-path">
            <Button
              variant="ghost"
              size="icon"
              ref={menuTrigger}
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <span className="header-brand">FireSight</span>
            <ChevronRight aria-hidden="true" />
            <span>{section}</span>
          </div>
          <div className="header-actions">
            <span className="mode-label">
              {api.mode === 'demo' ? 'Demo · local only' : 'API mode'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                prefs.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
              }
              title="Switch theme"
              onClick={() =>
                update({
                  theme: document.documentElement.classList.contains('dark') ? 'light' : 'dark',
                })
              }
            >
              {prefs.theme === 'dark' ||
              (prefs.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches) ? (
                <Sun />
              ) : (
                <Moon />
              )}
            </Button>
          </div>
        </header>
        {storageError ? (
          <p className="storage-banner" role="status">
            {storageError}
          </p>
        ) : null}
        <main id="main" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            FireSight <span aria-hidden="true">/</span> Scientific intelligence for space fire
            safety
          </span>
          <span>Provenance before prediction</span>
        </footer>
      </div>
    </div>
  )
}

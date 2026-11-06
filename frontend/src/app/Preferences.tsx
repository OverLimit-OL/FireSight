import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { z } from 'zod'
import { readStored, writeStored } from '@/lib/storage'

const schema = z.object({
  theme: z.enum(['system', 'dark', 'light']),
  density: z.enum(['comfortable', 'compact']),
  motion: z.enum(['system', 'reduce']),
  citations: z.enum(['inline', 'expanded']),
  collapsed: z.boolean(),
  scenario: z.enum(['normal', 'empty', 'error']),
})
export type Preferences = z.infer<typeof schema>
const defaults: Preferences = {
  theme: 'dark',
  density: 'comfortable',
  motion: 'system',
  citations: 'inline',
  collapsed: false,
  scenario: 'normal',
}
const Prefs = createContext<{
  prefs: Preferences
  update: (value: Partial<Preferences>) => void
  storageError: string
}>({ prefs: defaults, update: () => {}, storageError: '' })
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return { prefs: readStored('firesight:prefs:v1', schema, defaults), error: '' }
    } catch (e) {
      return {
        prefs: defaults,
        error: e instanceof Error ? e.message : 'Preferences could not be read.',
      }
    }
  })
  const [prefs, setPrefs] = useState(initial.prefs)
  const [storageError, setStorageError] = useState(initial.error)
  function update(value: Partial<Preferences>) {
    const next = { ...prefs, ...value }
    setPrefs(next)
    try {
      writeStored('firesight:prefs:v1', next)
      setStorageError('')
    } catch (e) {
      setStorageError(e instanceof Error ? e.message : 'Changes are temporary.')
    }
  }
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = prefs.theme === 'system' ? media.matches : prefs.theme === 'dark'
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#151a1e' : '#f5f7f8')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [prefs.theme])
  useEffect(() => {
    document.documentElement.dataset.density = prefs.density
    document.documentElement.dataset.motion = prefs.motion
  }, [prefs.density, prefs.motion])
  return <Prefs value={{ prefs, update, storageError }}>{children}</Prefs>
}
export const usePreferences = () => useContext(Prefs)

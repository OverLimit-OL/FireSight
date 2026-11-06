import { useEffect, useState, useSyncExternalStore } from 'react'
import { writeStored } from '@/lib/storage'

// Storage is external state: notify React only when persistence status changes.
// Successful keystroke saves do not schedule an extra component render.
export function useDraftPersistence(key: string, value: unknown, enabled = true) {
  const [writer] = useState(() => {
    let error = ''
    const listeners = new Set<() => void>()
    return {
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
      snapshot: () => error,
      write: (key: string, serialized: string) => {
        let next = ''
        try {
          writeStored(key, JSON.parse(serialized))
        } catch (e) {
          next = e instanceof Error ? e.message : 'Draft could not be saved.'
        }
        if (next !== error) {
          error = next
          listeners.forEach((listener) => listener())
        }
      },
    }
  })
  const serialized = JSON.stringify(value)
  useEffect(() => {
    if (enabled) writer.write(key, serialized)
  }, [key, serialized, writer, enabled])
  return useSyncExternalStore(writer.subscribe, writer.snapshot)
}

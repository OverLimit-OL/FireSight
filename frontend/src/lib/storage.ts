import { z } from 'zod'
import { APIError } from '@/types/research'

export function readStored<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : schema.parse(JSON.parse(raw))
  } catch {
    throw new APIError(
      'STORAGE_ERROR',
      `Local data could not be read (${key}). Use the recovery action to reset only this record.`,
    )
  }
}
export function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new APIError(
      'STORAGE_ERROR',
      'Browser storage is unavailable or full. Changes could not be saved. Keep this page open and free browser storage before retrying.',
    )
  }
}
export function resetStored(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    throw new APIError(
      'STORAGE_ERROR',
      'Browser storage could not be reset. Check browser storage permissions.',
    )
  }
}

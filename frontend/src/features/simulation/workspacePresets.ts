import { z } from 'zod'
import { readStored } from '@/lib/storage'
export const workspaceModeSchema = z.enum(['explore', 'workstation', 'analyze'])
export type WorkspaceMode = z.infer<typeof workspaceModeSchema>
export function readWorkspaceMode(): WorkspaceMode {
  try {
    return readStored('firesight:workspace-mode:v1', workspaceModeSchema, 'workstation')
  } catch {
    return 'workstation'
  }
}
export const workspacePresets = {
  explore: { configuration: false, inspector: false, analysis: false },
  workstation: { configuration: true, inspector: true, analysis: true },
  analyze: { configuration: false, inspector: true, analysis: true },
} satisfies Record<WorkspaceMode, { configuration: boolean; inspector: boolean; analysis: boolean }>

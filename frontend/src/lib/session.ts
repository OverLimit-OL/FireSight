import { emptyView } from '@/types/research'
import type { ResearchContext, LabSession } from '@/types/research'
export function newSession(context: ResearchContext): LabSession {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: context.studyIds.length ? 'Study exploration' : 'Untitled workspace',
    createdAt: now,
    updatedAt: now,
    revision: 0,
    context,
    visualization: emptyView(),
    selectedRowIds: [],
    notes: '',
    snapshots: [],
  }
}

import { QueryClient } from '@tanstack/react-query'
import { MockResearchApi } from '@/services/mock/MockResearchApi'
import { HttpResearchApi } from '@/services/api/HttpResearchApi'
import { APIError } from '@/types/research'

const mode = import.meta.env.VITE_DATA_MODE
if (mode !== 'demo' && mode !== 'http')
  throw new Error('Set VITE_DATA_MODE to demo or http. Silent fallback is disabled.')
if (mode === 'http' && !import.meta.env.VITE_API_BASE_URL)
  throw new Error('HTTP mode requires VITE_API_BASE_URL (origin without /api/v1).')
export const api =
  mode === 'demo' ? new MockResearchApi() : new HttpResearchApi(import.meta.env.VITE_API_BASE_URL)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) => count < 1 && error instanceof APIError && error.retryable,
    },
    mutations: { retry: false },
  },
})
export const keys = {
  studies: (scenario: string) => [api.mode, 'studies', scenario],
  conversations: [api.mode, 'conversations'],
  conversation: (id: string) => [api.mode, 'conversation', id],
  sessions: [api.mode, 'sessions'],
  session: (id: string) => [api.mode, 'session', id],
  dataset: (id: string) => [api.mode, 'dataset', id],
}
export async function refreshConversations() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.conversations }),
    queryClient.invalidateQueries({ queryKey: [api.mode, 'conversation'] }),
  ])
}
export async function refreshSessions() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.sessions }),
    queryClient.invalidateQueries({ queryKey: [api.mode, 'session'] }),
  ])
}

import { api } from '@/app/data'
import { MockSimulationApi } from './MockSimulationApi'
import { HttpSimulationApi } from './HttpSimulationApi'
export const simulationApi =
  api.mode === 'demo'
    ? new MockSimulationApi()
    : new HttpSimulationApi(import.meta.env.VITE_API_BASE_URL)
export const simulationKeys = {
  sessions: [api.mode, 'simulation-sessions'],
  session: (id: string) => [api.mode, 'simulation-session', id],
  models: [api.mode, 'simulation-models'],
  runs: (id: string) => [api.mode, 'simulation-runs', id],
}

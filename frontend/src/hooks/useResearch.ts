import { useQuery } from '@tanstack/react-query'
import { api, keys } from '@/app/data'
import { usePreferences } from '@/app/Preferences'
export function useStudies() {
  const { prefs } = usePreferences()
  return useQuery({
    queryKey: keys.studies(prefs.scenario),
    queryFn: () => api.listStudies(prefs.scenario),
  })
}

import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/app/data'
import { PreferencesProvider } from '@/app/Preferences'
import Shell from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Loading, PageHeading } from '@/components/shared'
const Home = lazy(() => import('@/features/chat/Home'))
const Chat = lazy(() => import('@/features/chat/Chat'))
const Resources = lazy(() => import('@/features/resources/Resources'))
const StudyDetail = lazy(() => import('@/features/resources/StudyDetail'))
const Lab = lazy(() => import('@/features/lab/Lab'))
const LabOverview = lazy(() => import('@/features/simulation/LabOverview'))
const NewExperiment = lazy(() => import('@/features/simulation/NewExperiment'))
const Studio = lazy(() => import('@/features/simulation/Studio'))
const Guide = lazy(() => import('@/features/guide/Guide'))
const Settings = lazy(() => import('@/features/settings/Settings'))
class AppErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    return this.state.error ? (
      <div className="page">
        <h1>Workspace could not be displayed</h1>
        <p>{this.state.error}</p>
        <Button onClick={() => window.location.reload()}>Reload workspace</Button>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="page">
                  <Loading />
                </div>
              }
            >
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<Home />} />
                  <Route path="chat/:conversationId" element={<Chat />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="resources/:studyId" element={<StudyDetail />} />
                  <Route path="lab" element={<LabOverview />} />
                  <Route path="lab/new" element={<NewExperiment />} />
                  <Route path="lab/studio/:simulationSessionId" element={<Studio />} />
                  <Route path="lab/:sessionId" element={<Lab />} />
                  <Route path="guide" element={<Guide />} />
                  <Route path="settings" element={<Settings />} />
                  <Route
                    path="*"
                    element={
                      <div className="page">
                        <PageHeading
                          label="Unknown destination"
                          title="This page is not in the notebook"
                          description="The link may be incomplete. Your saved research is still available."
                        />
                        <Button asChild>
                          <Link to="/">Open research workspace</Link>
                        </Button>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PreferencesProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

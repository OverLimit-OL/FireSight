import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-400-italic.css'
import 'katex/dist/katex.min.css'
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import './index.css'
import './features/simulation/workstation.css'
import './features/simulation/hybrid-workspace.css'
import './premium.css'
const root = createRoot(document.getElementById('root')!)
root.render(
  <main className="page" role="status">
    Opening Fire-XII…
  </main>,
)
import('./App')
  .then(({ default: App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((error: unknown) =>
    root.render(
      <main className="page">
        <h1>Fire-XII configuration needs attention</h1>
        <p role="alert">
          {error instanceof Error ? error.message : 'The application could not start.'}
        </p>
        <p>Check VITE_DATA_MODE and VITE_API_BASE_URL, then restart the development server.</p>
        <button onClick={() => window.location.reload()}>Reload workspace</button>
      </main>,
    ),
  )

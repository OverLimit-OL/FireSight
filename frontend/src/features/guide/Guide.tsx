import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, FlaskConical, MessageSquare, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './guide.css'

const topics = [
  {
    id: 'start',
    icon: KeyRound,
    title: 'Set up your workspace',
    intro: 'Create an account, then connect Gemini when you want to use the research assistant.',
    steps: [
      [
        'Connect Gemini',
        'Open Gemini setup in the header. Follow the Google AI Studio link, create an API key and save it. You can reveal the field to check what you pasted. The key is encrypted on the server.',
      ],
      [
        'Know what is shared',
        'Your question, relevant study context and extracted document text are sent to Google when you ask the assistant. Review your Google project’s quotas and billing.',
      ],
      [
        'Choose your preferences',
        'Settings controls the theme, interface density, motion and evidence presentation. You can return here from any workspace.',
      ],
    ],
    href: '/settings',
    action: 'Open settings',
  },
  {
    id: 'research',
    icon: MessageSquare,
    title: 'Ask a question and follow it further',
    intro:
      'Start with a suggested question or write your own. Select a study to give the assistant useful context.',
    steps: [
      [
        'Explore a conversation',
        'Try “How does FLEX approach fire suppression?” Then ask “Explain the droplet experiment step by step.” Follow-ups use the previous turns and retained research context.',
      ],
      [
        'Bring your documents',
        'Attach readable PDF, TXT, CSV or JSON files before sending. Files can be up to 10 MiB, and PDFs up to 200 pages. Extracted text is bounded, so ask about a focused section in large documents. Uploaded documents remain available for follow-ups.',
      ],
      [
        'Return to your work',
        'Open a saved conversation from Research history. Rename or delete it using the actions beside the conversation. Your account’s server records are available when you sign back in.',
      ],
    ],
    href: '/',
    action: 'Ask a research question',
  },
  {
    id: 'evidence',
    icon: BookOpen,
    title: 'Read the sources behind an answer',
    intro:
      'Resources contains investigation records. The evidence panel helps you inspect the material supporting a response.',
    steps: [
      [
        'Find a study',
        'Search Resources and filter by investigation or data availability. Open a record to read its objective, available metadata, source links and limitations. Select studies to compare their metadata.',
      ],
      [
        'Inspect evidence',
        'Choose a record under Evidence trail in an answer. Read the source, passage, provenance and limitations, then follow the original source. A paraphrase summarizes a source in new words.',
      ],
      [
        'Interpret availability',
        'A study description, an agency findings summary and numerical experimental data provide different kinds of evidence. Some records have only an overview. Illustrative scalar values in the Lab are dimensionless authored examples.',
      ],
    ],
    href: '/resources',
    action: 'Explore resources',
  },
  {
    id: 'lab',
    icon: FlaskConical,
    title: 'Your first Lab session',
    intro:
      'Use the Lab to inspect an illustrative apparatus, explore synchronized frames and keep the context for research questions.',
    steps: [
      [
        'Create an experiment',
        'Choose Lab, then New Experiment. Select the supported template and research context, name the experiment, choose an authored observation sequence and review its limits. Create the session to open the Studio.',
      ],
      [
        'Inspect the scene',
        'Switch between 3D apparatus and 2D section. In 3D, drag to orbit and right-drag to pan. Use the camera toolbar to zoom, reset or fit the experiment. Select the sample, enclosure, support, inlet, optical observation or combustion region.',
      ],
      [
        'Use the inspector',
        'The research panel describes your selection. Focus camera brings the component into view. Evidence links open the related research context. Ask AI about selection carries the component, frame and run into the Copilot.',
      ],
      [
        'Load and play observations',
        'Use Run demonstration or Run simulation to load the authored sequence. Play, pause, adjust speed, step or select a frame. The scene, plots and inspector follow the same frame. A gap in a plot means the sample is missing at that frame.',
      ],
      [
        'Explore analysis and comparison',
        'Expand the bottom dock for Measurements, Comparison and Runs. Select a plotted sample to inspect its frame. Compare available saved outputs while checking their original configuration and provenance.',
      ],
      [
        'Configure the workspace',
        'Resize the dock separators by dragging, or focus a separator and use arrow keys. Collapse configuration or research panels and use focus view for a larger scene. On smaller screens, expand the tools you need.',
      ],
      [
        'Save a revision',
        'Save experiment after changing the supported demonstration configuration. Configuration history lets you revisit earlier revisions. A saved run retains its original revision. Visualization switches update the view immediately. Scientific parameter fields explain which conditions require a future engine.',
      ],
      [
        'Continue in Chat',
        'Ask a contextual question in Copilot, then open the conversation in Chat. Linked simulation context lets you reopen the selected Studio state. In API mode Gemini needs your configured key. Demo mode labels scripted responses.',
      ],
    ],
    href: '/lab/new',
    action: 'Create your first experiment',
  },
]

export default function Guide() {
  return (
    <div className="page guide-page">
      <header className="guide-intro">
        <p className="eyebrow">Workspace guide</p>
        <h1>
          From your first question
          <br />
          to the experiment.
        </h1>
        <p>
          Learn the research workflow and the tools around the Lab. Open any topic below and try it
          in your workspace.
        </p>
      </header>
      <nav className="guide-nav" aria-label="Guide topics">
        {topics.map((topic) => (
          <a key={topic.id} href={'#' + topic.id}>
            <topic.icon size={16} />
            {topic.title}
          </a>
        ))}
      </nav>
      {topics.map((topic) => (
        <section className="guide-topic" id={topic.id} key={topic.id}>
          <div className="guide-topic-heading">
            <topic.icon size={24} />
            <div>
              <h2>{topic.title}</h2>
              <p>{topic.intro}</p>
            </div>
          </div>
          <div className="guide-steps">
            {topic.steps.map(([title, body], index) => (
              <details key={title} open={index === 0}>
                <summary>{title}</summary>
                <p>{body}</p>
              </details>
            ))}
          </div>
          <Button asChild>
            <Link to={topic.href}>
              {topic.action}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </section>
      ))}
      <aside className="guide-limits">
        <h2>Understand the model’s scope</h2>
        <p>
          The current Lab uses schematic geometry and preauthored scalar frames. Changes to physical
          conditions need a computational engine. Research answers use the available context and
          source material, and require checking against the original records before scientific use.
        </p>
      </aside>
    </div>
  )
}

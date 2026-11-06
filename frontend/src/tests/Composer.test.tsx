import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import Composer from '@/features/chat/Composer'
import { emptyContext } from '@/types/research'
function setup() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Composer initialContext={emptyContext()} draftId="test" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
it('explains an empty submission and focuses the question', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Send research question' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a research question')
  expect(screen.getByRole('textbox', { name: 'Research question' })).toHaveFocus()
})
it('stages, rejects duplicates, removes and reselects a local file', async () => {
  setup()
  const user = userEvent.setup()
  const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' })
  await user.upload(screen.getByLabelText('Choose research attachments'), file)
  expect(screen.getByText('Staged locally · unprocessed')).toBeVisible()
  await user.upload(screen.getByLabelText('Choose research attachments'), file)
  expect(screen.getByRole('alert')).toHaveTextContent('already staged')
  await user.click(screen.getByRole('button', { name: 'Remove attachment data.csv' }))
  expect(screen.queryByText('data.csv')).not.toBeInTheDocument()
  await user.upload(screen.getByLabelText('Choose research attachments'), file)
  expect(screen.getByText('data.csv')).toBeVisible()
})

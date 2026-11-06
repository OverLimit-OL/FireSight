import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('connected research journey retains study, evidence and Lab snapshots', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/resources')
  await page.getByLabel('Search research').fill('BASS')
  await expect(page.getByText('2 investigations', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Compare BASS', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Compare BASS', exact: true })).toBeChecked()
  await page.getByRole('checkbox', { name: 'Compare BASS-II', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Compare BASS-II', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Compare studies' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: 'output/playwright/comparison-dark-1440.png', fullPage: true })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page
    .getByRole('heading', { name: 'Burning and Suppression of Solids', exact: true })
    .click()
  await expect(page).toHaveURL(/resources\/bass$/)
  await page.getByRole('link', { name: 'Ask about this study' }).click()
  await expect(page.getByRole('button', { name: 'Remove study BASS', exact: true })).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Research question' })
    .fill('Review BASS research context. $E=mc^2$')
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page).toHaveURL(/\/chat\//)
  const chatURL = page.url()
  await expect(page.getByText('Scripted demonstration', { exact: true })).toBeVisible()
  await expect(page.locator('.katex').first()).toBeVisible()
  await page.getByRole('button', { name: 'Inspect BASS evidence', exact: true }).click()
  await expect(page.getByText('Uncertainty not reported', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'output/playwright/evidence-dark-1440.png', fullPage: false })
  await page.getByRole('link', { name: 'Open related study' }).click()
  await expect(page).toHaveURL(/resources\/bass#objective/)
  await page.goto(chatURL)
  await page.locator('.assistant').getByRole('button', { name: 'Open in Lab', exact: true }).click()
  await expect(page).toHaveURL(/\/lab\//)
  await expect(page.getByText('Study context · no measurements', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Select data to inspect' })).toBeVisible()
  await page.getByRole('button', { name: 'Load synthetic example' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('unrelated to NASA')
  await page.getByRole('button', { name: 'Use synthetic example' }).click()
  await expect(
    page.getByText('Synthetic demonstration · no physical interpretation', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('Inspect a sample').selectOption('sample-11')
  await expect(page.getByRole('status').filter({ hasText: 'a: missing' })).toBeVisible()
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click()
  await page.getByText('Scatter', { exact: true }).click()
  await expect(page.locator('.recharts-scatter-symbol').first()).toBeVisible()
  await page.locator('.recharts-scatter').first().locator('.recharts-scatter-symbol').last().click()
  await expect(page.getByLabel('Inspect a sample')).toHaveValue('sample-24')
  await page.screenshot({ path: 'output/playwright/lab-scatter-dark-1440.png', fullPage: true })
  await page.getByText('Table', { exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Missing', exact: true })).toBeVisible()
  await page.getByText('Line', { exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Research notes' })
    .fill('User note: inspect the missing sample before comparing traces.')
  await page.getByRole('button', { name: 'Save workspace', exact: true }).click()
  const labURL = page.url()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Research notes' })).toHaveValue(
    'User note: inspect the missing sample before comparing traces.',
  )
  await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
  await page.screenshot({ path: 'output/playwright/lab-line-dark-1440.png', fullPage: true })
  await page.getByRole('button', { name: 'Ask about this view' }).click()
  await expect(page.getByText('Synthetic Lab view', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Synthetic Lab view', { exact: true })).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Research question' })
    .fill('Keep this synthetic view as context.')
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page).toHaveURL(/\/chat\//)
  await expect(page.getByText(/Saved view · Synthetic demonstration/).first()).toBeVisible()
  await page.goto(labURL)
  await expect(page.getByRole('textbox', { name: 'Research notes' })).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('conversation lifecycle, keyboard send, theme and sidebar persistence', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Research question' }).fill('Evidence check')
  await page.getByRole('textbox', { name: 'Research question' }).press('Control+Enter')
  await expect(page).toHaveURL(/chat\//)
  const chatURL = page.url()
  await page.getByRole('button', { name: 'Rename Evidence check', exact: true }).click()
  await page.getByRole('textbox', { name: 'Conversation title' }).fill('My combustion notebook')
  await page.getByRole('button', { name: 'Save title', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'My combustion notebook', exact: true }),
  ).toBeVisible()
  await page.getByRole('textbox', { name: 'Search conversations' }).fill('no match')
  await expect(page.getByText('No conversations match.')).toBeVisible()
  await page.getByRole('textbox', { name: 'Search conversations' }).fill('')
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('link', { name: 'Resources', exact: true }).click()
  await page.goBack()
  await expect(page).toHaveURL(chatURL)
  await page.getByRole('button', { name: 'Delete My combustion notebook', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My combustion notebook' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete My combustion notebook', exact: true }).click()
  await page.getByRole('button', { name: 'Delete conversation', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Your research conversations will appear here.')).toBeVisible()
})

test('attachments remain local and need reselection after reload', async ({ page }) => {
  const uploads: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST') uploads.push(r.url())
  })
  await page.goto('/')
  await page
    .getByLabel('Choose research attachments')
    .setInputFiles({ name: 'example.csv', mimeType: 'text/csv', buffer: Buffer.from('x,y\n1,2') })
  await expect(page.getByText('Staged locally · unprocessed')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Reselect required')).toBeVisible()
  await page.getByRole('textbox', { name: 'Research question' }).fill('Inspect file')
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page.getByRole('alert')).toContainText('Reselect or remove')
  await page.getByRole('button', { name: 'Remove attachment example.csv' }).click()
  expect(uploads).toEqual([])
})

test('demo errors, empty states, preferences and invalid routes are recoverable', async ({
  page,
}) => {
  await page.goto('/settings')
  await page.getByLabel('Demo scenario').selectOption('error')
  await page.getByRole('link', { name: 'Resources', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Simulated collection error')
  await page.goto('/settings')
  await page.getByLabel('Demo scenario').selectOption('empty')
  await page.getByRole('link', { name: 'Resources', exact: true }).click()
  await expect(page.getByText('No investigations match', { exact: true })).toBeVisible()
  await page.goto('/settings')
  await page.getByLabel('Demo scenario').selectOption('normal')
  await page.getByText('Compact', { exact: true }).click()
  await page.getByText('Reduce motion', { exact: true }).click()
  await page.getByText('Expanded sources', { exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce')
  await page.goto('/resources/does-not-exist')
  await expect(page.getByRole('alert')).toContainText('not found')
  await page.goto('/not-a-route')
  await expect(
    page.getByRole('heading', { name: 'This page is not in the notebook' }),
  ).toBeVisible()
})

test('mobile navigation traps focus, closes, and restores its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const dialog = page.getByRole('dialog', { name: 'Navigation' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await dialog.getByRole('link', { name: 'Resources', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'The investigation library' })).toBeVisible()
  await expect(dialog).not.toBeVisible()
})

for (const width of [1440, 1280, 768, 390, 320]) {
  test(`visual and accessibility matrix ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const theme of ['dark', 'light']) {
      await page.goto('/settings')
      await page.getByText(theme === 'dark' ? 'Dark' : 'Light', { exact: true }).click()
      for (const [route, name] of [
        ['/', 'home'],
        ['/resources', 'resources'],
        ['/resources/bass', 'study'],
        ['/lab', 'lab-empty'],
        ['/settings', 'settings'],
      ]) {
        await page.goto(route)
        await expect(page.locator('h1')).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        if (name === 'home')
          await expect(
            page.getByRole('link', { name: 'BASS Solid-fuel combustion', exact: true }),
          ).toBeVisible()
        if (name === 'resources')
          await expect(page.getByText('5 investigations', { exact: true })).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `${route} ${theme} ${width}px horizontal overflow`,
        ).toBe(true)
        await page.screenshot({
          path: `output/playwright/${name}-${theme}-${width}.png`,
          fullPage: true,
        })
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(
          results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          `${route} ${theme} ${width}px a11y`,
        ).toEqual([])
      }
    }
    expect(errors).toEqual([])
  })
}

test('populated scientific views, evidence and transcript remain accessible at every viewport', async ({
  page,
}) => {
  test.setTimeout(150000)
  await page.goto('/resources/bass')
  await page.getByRole('button', { name: 'Open in Lab', exact: true }).click()
  await page.getByRole('button', { name: 'Load synthetic example' }).click()
  await page.getByRole('button', { name: 'Use synthetic example' }).click()
  await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
  await page.getByLabel('Inspect a sample').selectOption('sample-11')
  await page.getByRole('button', { name: 'Save workspace', exact: true }).click()
  const labURL = page.url()
  await page.getByRole('button', { name: 'Ask about this view' }).click()
  await page
    .getByRole('textbox', { name: 'Research question' })
    .fill('Trace the sources behind this view.')
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page).toHaveURL(/chat\//)
  const chatURL = page.url()
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const theme of ['dark', 'light']) {
      await page.goto('/settings')
      await page.getByText(theme === 'dark' ? 'Dark' : 'Light', { exact: true }).click()
      await page.goto(chatURL)
      await expect(page.getByRole('textbox', { name: 'Research question' })).toBeVisible()
      await page.getByRole('button', { name: 'Inspect BASS evidence', exact: true }).click()
      await expect(page.getByRole('dialog', { name: 'Follow the evidence' })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `output/playwright/evidence-${theme}-${width}.png` })
      const evidenceAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        evidenceAudit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([])
      await page.keyboard.press('Escape')
      await expect(
        page.getByRole('button', { name: 'Inspect BASS evidence', exact: true }),
      ).toBeFocused()
      await page.screenshot({ path: `output/playwright/chat-${theme}-${width}.png` })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const chatAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        chatAudit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([])
      await page.goto(labURL)
      await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
      await page.getByRole('button', { name: 'Show accessible sample table' }).click()
      await expect(page.getByRole('cell', { name: 'Missing', exact: true })).toBeVisible()
      await page.screenshot({
        path: `output/playwright/lab-populated-${theme}-${width}.png`,
        fullPage: true,
      })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const chartAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(
        chartAudit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([])
    }
  }
})

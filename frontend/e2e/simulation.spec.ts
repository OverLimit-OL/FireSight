import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
async function create(page: Page, title = 'Field investigation') {
  await page.goto('/lab/new')
  await expect(page.getByRole('heading', { name: 'Choose what can be evaluated' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Experiment title', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await expect(page).toHaveURL(/lab\/studio\//)
  return page.url()
}
async function run(page: Page) {
  const previous = new URL(page.url()).searchParams.get('run')
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await expect.poll(() => new URL(page.url()).searchParams.get('run')).not.toBe(previous)
  await expect(page.locator('.run-status')).toHaveText('completed')
  await expect(page.getByLabel('Jump to frame')).toBeVisible()
}

test('studio preserves exact samples, revisions, comparison, fork and research context', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/resources/bass?view=interactive')
  await expect(page.getByRole('heading', { name: 'Interactive Experiment View' })).toBeVisible()
  await expect(page.getByText('Reconstruction data not connected', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Explore available models' }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page
    .getByLabel('Experiment title', { exact: true })
    .fill('BASS context · illustrative only')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await run(page)
  const studioURL = page.url()
  await page.getByLabel('Jump to frame').selectOption('4')
  await expect(page.locator('.simulation-trace')).toContainText('×')
  await page.getByRole('button', { name: 'Next frame', exact: true }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('5')
  await page.getByRole('button', { name: 'Previous frame', exact: true }).click()
  await page.getByRole('button', { name: 'Play output frames', exact: true }).click()
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click()
  await page.getByLabel('Jump to frame').selectOption('4')
  await page.getByRole('button', { name: 'Exact sample table', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Missing', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Return to experiment', exact: true }).click()
  await page.getByLabel('Demonstration configuration', { exact: true }).selectOption('offset')
  await expect(page.locator('.configuration-state')).toContainText(
    'Results belong to an earlier configuration',
  )
  await expect(
    page.locator('.run-command').getByRole('button', { name: 'Run demonstration' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Save configuration', exact: true }).click()
  await expect(
    page.getByText('Saved new configuration revision on this device.', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.run-identity-strip')).toContainText('r1')
  await run(page)
  await page.getByRole('button', { name: 'Comparison', exact: true }).click()
  await page.getByLabel('Pin comparison').selectOption({ index: 1 })
  await expect(page.getByRole('heading', { name: /Pinned run · r1/ })).toBeVisible()
  await page.getByLabel('Jump to frame').selectOption('4')
  await page.getByRole('button', { name: 'Exact sample table', exact: true }).click()
  await page.getByRole('button', { name: 'Select sample p-111', exact: true }).click()
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await expect(page.locator('.docked-copilot')).toContainText('Missing')
  await page.getByRole('button', { name: 'Preview a demo suggestion' }).click()
  await page.getByRole('button', { name: 'Cancel suggestion' }).click()
  await page.getByRole('button', { name: 'Preview a demo suggestion' }).click()
  await page.getByRole('button', { name: 'Apply table view' }).click()
  await expect(page.locator('.sample-table')).toBeVisible()
  if (
    !(await page
      .getByRole('button', { name: 'Continue in Research Chat', exact: true })
      .isVisible())
  )
    await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await page.getByRole('button', { name: 'Continue in Research Chat', exact: true }).click()
  await expect(page).toHaveURL(/\?simulation=/)
  await expect(
    page.getByText('Illustrative Studio · step 4 · p-111', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByText('Illustrative Studio · step 4 · p-111', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page).toHaveURL(/chat\//)
  await expect(page.locator('.assistant')).toContainText('not NASA measurements')
  await page.locator('.assistant').getByRole('link', { name: 'Reopen exact Studio state' }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
  await expect(page.locator('.sample-table')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
  await page.getByRole('button', { name: 'Fork experiment', exact: true }).click()
  await expect(page).not.toHaveURL(studioURL)
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.getByText('Your first run will appear here.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'parent experiment', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Research Lab', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'BASS context · illustrative only · fork', exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
test('job cancellation, failure recovery and 3D context loss preserve configuration', async ({
  page,
}) => {
  await create(page, 'Recovery check')
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByRole('button', { name: 'Cancel fixture load' }).click()
  await expect(page.getByRole('heading', { name: 'Load cancelled', exact: true })).toBeVisible()
  await page.getByText('Demonstration controls', { exact: true }).click()
  await page.getByLabel('Next fixture load').selectOption('fail')
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Fixture load failed', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Next fixture load').selectOption('complete')
  await run(page)
  await page.getByRole('button', { name: 'Measurements', exact: true }).click()
  await page.getByLabel('Jump to frame').selectOption('4')
  await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
  await expect(page.locator('.field-3d canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Orbit camera', exact: true }).click()
  await page.getByRole('button', { name: 'Zoom camera in', exact: true }).click()
  await page.getByRole('button', { name: 'Focus selected component', exact: true }).click()
  await page.getByRole('button', { name: 'Reset camera', exact: true }).click()
  await page.screenshot({ path: 'output/playwright/studio-3d-dark-1440.png', fullPage: true })
  await page.setViewportSize({ width: 320, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: 'output/playwright/studio-3d-dark-320.png', fullPage: true })
  await page.getByRole('button', { name: 'Exact sample table', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Missing', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  const inspectorAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(inspectorAudit.violations.map((v) => v.id)).toEqual([])
  await page.screenshot({ path: 'output/playwright/studio-inspector-dark-320.png' })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Return to experiment', exact: true }).click()
  await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
  await page
    .locator('.field-3d canvas[data-renderer-ready="true"]')
    .evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.getByRole('button', { name: '2D section', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('sample')
})
test('studio and creation are accessible and do not overflow at five widths in both themes', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const studioURL = await create(page, 'Viewport review')
  await run(page)
  const populatedURL = page.url()
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const theme of ['dark', 'light']) {
      await page.goto('/settings')
      await page.getByText(theme === 'dark' ? 'Dark' : 'Light', { exact: true }).click()
      for (const [route, name] of [
        [populatedURL, 'studio'],
        ['/lab/new', 'experiment-creation'],
      ]) {
        await page.goto(route)
        await expect(page.locator('h1')).toBeVisible()
        if (name === 'studio') {
          await expect(page.locator('.experiment-viewport')).toBeVisible()
          await page.getByLabel('Jump to frame').selectOption('4')
        }
        await page.evaluate(() => document.fonts.ready)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name} ${theme} ${width}`,
        ).toBe(true)
        await page.screenshot({
          path: `output/playwright/${name}-${theme}-${width}.png`,
          fullPage: true,
        })
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(
          audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          `${name} ${theme} ${width}`,
        ).toEqual([])
      }
    }
  }
  await page.goto(studioURL)
  expect(errors).toEqual([])
})

test('configuration-only Copilot and unavailable WebGL remain useful', async ({ page }) => {
  const studioURL = await create(page, 'No output yet')
  if (
    !(await page
      .getByRole('button', { name: 'Continue in Research Chat', exact: true })
      .isVisible())
  )
    await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await page.getByRole('button', { name: 'Continue in Research Chat', exact: true }).click()
  await expect(
    page.getByText('Illustrative Studio · step not run · sample', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Send research question' }).click()
  await expect(page.locator('.assistant')).toContainText('not started')
  await page.locator('.assistant').getByRole('link', { name: 'Reopen exact Studio state' }).click()
  await page.getByRole('button', { name: 'Runs', exact: true }).click()
  await expect(page.getByText('Your first run will appear here.', { exact: true })).toBeVisible()
  await run(page)
  await page.getByRole('button', { name: 'Measurements', exact: true }).click()
  await page.getByLabel('Jump to frame').selectOption('4')
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.reload()
  await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Use 2D view' })).toBeVisible()
  await page.getByRole('button', { name: 'Use 2D view' }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
  await expect(page.locator('.simulation-trace')).toContainText('×')
  await page.goBack()
  await page.goForward()
  await expect(page).toHaveURL(/lab\/studio\//)
  expect(studioURL).toContain('/lab/studio/')
})

test('apparatus selections, schematic, export, contextual Copilot and resource handoff work', async ({
  page,
}) => {
  await page.goto('/resources/bass?view=interactive')
  await page.getByLabel('Inspect component', { exact: true }).selectOption('holder')
  await expect(page.locator('.embedded-component-role')).toContainText('mounting assembly')
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await page.getByRole('button', { name: 'Select Optical observation', exact: true }).click()
  await expect(page.locator('.embedded-component-role')).toContainText('Schematic camera')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export visualization', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('firesight-schematic.svg')
  await page.getByRole('link', { name: 'Open in full Lab', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Experiment title', { exact: true }).fill('Optical inspection')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('camera')
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await page.getByRole('button', { name: 'Explain selected component', exact: true }).click()
  await expect(page.locator('.copilot-thread')).toContainText('Simulated Copilot response')
  await expect(page.locator('.copilot-thread')).toContainText('Schematic camera')
  await page.getByRole('button', { name: 'Continue in Research Chat', exact: true }).click()
  await expect(
    page.getByText('Illustrative Studio · step not run · camera', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Send research question', exact: true }).click()
  await expect(page.locator('.assistant')).toContainText('Selected schematic component: camera')
  await page
    .locator('.assistant')
    .getByRole('link', { name: 'Reopen exact Studio state', exact: true })
    .click()
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('camera')
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').selectOption('3')
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await page.getByRole('button', { name: 'Select Solid fuel sample', exact: true }).click()
  await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('3')
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('sample')
  await page.getByRole('checkbox', { name: 'Enclosure & supports', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Scientific annotations', exact: true }).uncheck()
  await expect(page.locator('.scene-annotation')).toHaveCount(0)
  await page.getByRole('button', { name: 'Focus view', exact: true }).click()
  await expect(page.locator('.viewport-focus')).toBeVisible()
  await page.getByRole('button', { name: 'Exit focus', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('3')
})

test('setup scene controls do not submit the guided form', async ({ page }) => {
  await page.goto('/lab/new')
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Choose what can be evaluated', exact: true }),
  ).toBeVisible()
  await page
    .locator('.component-ribbon')
    .getByRole('button', { name: 'Sample support', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Choose what can be evaluated', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Define this configuration', exact: true }),
  ).toBeVisible()
})

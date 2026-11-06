import { test, expect } from '@playwright/test'
import { PerspectiveCamera, Vector3 } from 'three'
async function create(page: import('@playwright/test').Page) {
  await page.goto('/lab/new')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Experiment title', { exact: true }).fill('Workstation investigation')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await page.locator('canvas[data-renderer-ready=true]').waitFor()
  return page.url()
}
test('docks resize by pointer and keyboard, collapse, persist, and fit the window', async ({
  page,
}) => {
  await create(page)
  const left = page.getByRole('separator', { name: 'Resize configuration panel', exact: true })
  const original = await page
    .locator('.configuration-dock')
    .evaluate((e) => e.getBoundingClientRect().width)
  const rect = (await left.boundingBox())!
  await page.mouse.move(rect.x + 3, rect.y + 80)
  await page.mouse.down()
  await page.mouse.move(rect.x + 35, rect.y + 80)
  await page.mouse.up()
  expect(
    await page.locator('.configuration-dock').evaluate((e) => e.getBoundingClientRect().width),
  ).toBeGreaterThan(original)
  const right = page.getByRole('separator', { name: 'Resize research panel', exact: true })
  await right.focus()
  const before = Number(await right.getAttribute('aria-valuenow'))
  await page.keyboard.press('ArrowLeft')
  await expect(right).toHaveAttribute('aria-valuenow', String(before + 16))
  const bottom = page.getByRole('separator', { name: 'Resize analysis dock', exact: true })
  await bottom.focus()
  await page.keyboard.press('ArrowUp')
  await expect(bottom).toHaveAttribute('aria-valuenow', '256')
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').waitFor()
  await page.getByRole('button', { name: 'Collapse analysis', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play output frames', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Expand analysis', exact: true }).click()
  await page.waitForTimeout(600)
  await page.reload()
  await expect(right).toHaveAttribute('aria-valuenow', String(before + 16))
  await expect(bottom).toHaveAttribute('aria-valuenow', '256')
  await page.getByRole('button', { name: 'Close configuration', exact: true }).click()
  await expect(left).toHaveCount(0)
  await page.getByRole('button', { name: 'Configuration', exact: true }).click()
  await expect(left).toBeVisible()
  await page.getByRole('button', { name: 'Close research panel', exact: true }).click()
  await expect(right).toHaveCount(0)
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await expect(right).toBeVisible()
  await page.getByRole('button', { name: 'Toggle primary navigation', exact: true }).click()
  await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
test('direct picking, shared selection, parameter boundaries, linked measurements and persistent conversation', async ({
  page,
}) => {
  await create(page)
  const canvas = page.locator('.field-3d canvas[data-renderer-ready=true]')
  const box = (await canvas.boundingBox())!
  const camera = new PerspectiveCamera(45, box.width / box.height, 0.1, 1000)
  camera.position.set(3.8, 1.8, 7.2).multiplyScalar(Math.max(1, 1.05 / (box.width / box.height)))
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  const point = new Vector3(1.8, -0.15, 1).project(camera)
  await canvas.click({
    position: { x: ((point.x + 1) * box.width) / 2, y: ((1 - point.y) * box.height) / 2 },
  })
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('camera')
  await expect(page.locator('.selection-content')).toContainText('Optical observation')
  await page.getByRole('button', { name: 'Focus camera', exact: true }).click()
  await page.getByRole('button', { name: 'Reset camera', exact: true }).click()
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await page.getByRole('button', { name: 'Select Solid fuel sample', exact: true }).click()
  await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('sample')
  await page.getByRole('checkbox', { name: 'Scientific annotations', exact: true }).uncheck()
  await expect(page.locator('.scene-annotation')).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Combustion envelope', exact: true }).uncheck()
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Select Combustion region', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Combustion envelope', exact: true }).check()
  await page.getByText('Scientific parameters', { exact: true }).click()
  await expect(page.getByText('Engine required', { exact: true })).toHaveCount(2)
  await expect(page.getByRole('spinbutton')).toHaveCount(0)
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').selectOption('2')
  await page.getByRole('button', { name: /Inspect step 6, value/ }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('6')
  await expect(page.locator('.scene-footnote')).toContainText('Step 6')
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await page
    .getByLabel('Ask Copilot', { exact: true })
    .fill('What does the selected sample tell us?')
  await page.getByRole('button', { name: 'Send contextual question', exact: true }).click()
  await expect(page.locator('.copilot-thread')).toContainText('No inference service is connected')
  await page.getByRole('button', { name: 'Close research panel', exact: true }).click()
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await expect(page.locator('.copilot-thread')).toContainText(
    'What does the selected sample tell us?',
  )
  await page.waitForTimeout(600)
  await page.reload()
  await page.getByRole('button', { name: 'Research & Copilot', exact: true }).click()
  await expect(page.locator('.copilot-thread')).toContainText(
    'What does the selected sample tell us?',
  )
  await page.getByRole('button', { name: 'Continue in Research Chat', exact: true }).click()
  await expect(
    page.getByText('Illustrative Studio · step 6 · p-111', { exact: true }),
  ).toBeVisible()
})
test('renderer rests when idle and cleans up repeated 2D/3D switches', async ({ page }) => {
  await page.addInitScript(() => {
    const original = requestAnimationFrame
    Object.assign(window, { frameRequests: 0 })
    window.requestAnimationFrame = (callback) => {
      ;(window as unknown as { frameRequests: number }).frameRequests++
      return original(callback)
    }
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await create(page)
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '2D section', exact: true }).click()
    await page.getByRole('button', { name: '3D apparatus', exact: true }).click()
    await expect(page.locator('.field-3d canvas')).toHaveCount(1)
  }
  await page.waitForTimeout(1200)
  const before = await page.evaluate(
    () => (window as unknown as { frameRequests: number }).frameRequests,
  )
  await page.waitForTimeout(500)
  const after = await page.evaluate(
    () => (window as unknown as { frameRequests: number }).frameRequests,
  )
  expect(after - before).toBeLessThanOrEqual(2)
  await page
    .locator('canvas[data-renderer-ready=true]')
    .evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.getByRole('button', { name: '2D section', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(errors).toEqual([])
})

test('unreadable draft recovery preserves saved experiments and runs', async ({ page }) => {
  await create(page)
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').waitFor()
  const runId = new URL(page.url()).searchParams.get('run')
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith('firesight:simulation-draft:v1:'),
    )
    if (!key) throw Error('Missing draft')
    localStorage.setItem(key, '{broken')
  })
  await page.reload()
  await page.getByRole('button', { name: 'Reset unreadable Studio draft…', exact: true }).click()
  await page.getByRole('button', { name: 'Reset Studio draft', exact: true }).click()
  await expect(page.getByLabel('Experiment title', { exact: true })).toHaveValue(
    'Workstation investigation',
  )
  await expect(page.getByLabel('Jump to frame')).toBeVisible()
  expect(new URL(page.url()).searchParams.get('run')).toBe(runId)
  await expect(
    page.getByRole('button', { name: 'Reset unreadable Studio draft…', exact: true }),
  ).toHaveCount(0)
})

test('linked research returns to the same session, run, frame and selection', async ({ page }) => {
  await page.goto('/lab/new?study=bass')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Experiment title', { exact: true }).fill('Research round trip')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').selectOption('5')
  await page.getByLabel('Inspect component', { exact: true }).selectOption('camera')
  await page.getByRole('button', { name: '2D section', exact: true }).click()
  await expect(page.getByRole('button', { name: '2D section', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('Jump to frame')).toHaveValue('5')
  const original = new URL(page.url())
  await page.locator('.selection-content').getByRole('link', { name: 'BASS', exact: true }).click()
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('camera')
  await expect(page.getByRole('button', { name: '2D section', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('link', { name: 'Open in full Lab', exact: true }).click()
  expect(new URL(page.url()).pathname).toBe(original.pathname)
  expect(new URL(page.url()).searchParams.get('run')).toBe(original.searchParams.get('run'))
  await expect(page.getByLabel('Jump to frame')).toHaveValue('5')
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('camera')
  await expect(page.getByRole('button', { name: '2D section', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

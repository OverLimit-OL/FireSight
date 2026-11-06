import { test, expect } from '@playwright/test'

test('workspace presets preserve identities, coordinate split selection, and persist', async ({
  page,
}) => {
  await page.goto('/lab/new')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Experiment title', { exact: true }).fill('Hybrid workstation')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create experiment', exact: true }).click()
  await page
    .locator('.run-command')
    .getByRole('button', { name: 'Run demonstration', exact: true })
    .click()
  await page.getByLabel('Jump to frame').selectOption('4')
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
  await page.getByLabel('Inspect component', { exact: true }).selectOption('camera')
  await expect(page.locator('.selection-content')).toContainText('Optical observation')
  const before = new URL(page.url())
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page.locator('.configuration-dock')).toHaveCount(0)
  await expect(page.locator('.docked-copilot')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Play output frames', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Analyze', exact: true }).click()
  await expect(page.getByLabel('Linked 2D section')).toBeVisible()
  await expect(page.getByLabel('Linked 2D section')).toContainText('step 4')
  await page
    .getByLabel('Linked 2D section')
    .getByRole('button', { name: 'Select Solid fuel sample', exact: true })
    .click()
  await expect(page.getByLabel('Inspect component', { exact: true })).toHaveValue('sample')
  await expect(page.locator('.selection-content')).toContainText('Solid fuel sample')
  for (const key of ['run', 'frame'])
    expect(new URL(page.url()).searchParams.get(key)).toBe(before.searchParams.get(key))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Analyze', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('Linked 2D section')).toContainText('step 4')
  await page.getByRole('button', { name: 'Workstation', exact: true }).click()
  await expect(page.getByLabel('Linked 2D section')).toHaveCount(0)
  await expect(page.locator('.configuration-dock')).toBeVisible()
  await page.getByRole('button', { name: 'Pan camera', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pan camera', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Fit experiment', exact: true }).click()
  await expect(page.getByLabel('Jump to frame')).toHaveValue('4')
})

import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils'
import * as modelDefinition from './fileSelection.model'

let projectSlug: string

test.beforeAll(async ({}, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('file selection', async ({ page }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/file-selection`)
	await page.waitForLoadState('networkidle')

	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('01-initial.png')

	// await page.locator('button:has-text("Upload files")').click()

	const [fileChooser] = await Promise.all([
		page.waitForEvent('filechooser'),
		page.locator('button:has-text("Upload files")').click(),
	])
	await fileChooser.setFiles('./tests/playwright/cases/data/logo.png')

	await page.waitForTimeout(1000)
	await page.waitForLoadState('networkidle')

	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('02-upload.png')

	await page.locator('button:has-text("Save")').click()
	await page.locator('.cui-toaster button').click()

	await page.locator('button:has-text("Select files")').click()

	await page.locator('.cui-card-thumbnail').click()
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('03-select.png')

	await page.locator('button:has-text("Confirm")').click()

	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('04-confirm.png')

	await page.locator('button:has-text("Save")').click()

})

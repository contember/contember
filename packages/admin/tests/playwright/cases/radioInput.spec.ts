import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils.ts'
import * as modelDefinition from './radioInput.model.ts'

let projectSlug: string

test.beforeAll(async ({ }, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('basic test', async ({ page }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/radio-input`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('.cui-radio')
	expect(await page.screenshot()).toMatchSnapshot('initial.png')

	await page.locator('text=Draft').click()
	await page.waitForTimeout(300)
	expect(await page.screenshot()).toMatchSnapshot('selected-draft.png')

	await page.locator('text=Review').click()
	await page.waitForTimeout(300)
	expect(await page.screenshot()).toMatchSnapshot('selected-review.png')

	await page.locator('text=Published').click()
	await page.waitForTimeout(300)
	expect(await page.screenshot()).toMatchSnapshot('selected-published.png')

	await page.locator('button:has-text("Save")').click()
	await page.waitForSelector('.cui-toaster-item')
	expect(await page.screenshot()).toMatchSnapshot('after-save.png')
})

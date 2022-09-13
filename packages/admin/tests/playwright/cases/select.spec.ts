import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils'
import * as modelDefinition from './select.model'

let projectSlug: string

test.beforeAll(async ({ }, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('basic test', async ({ page }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/select`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('#pw-title')
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('01-initial.png')

	await page.locator('#pw-title').click()
	await page.locator('#deselected').click()
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('02-deselected.png')

	await page.locator('#pw-title').click()
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('03-opened-dialog.png')

	await page.locator('#react-select-2-option-1').click()
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('04-selected-item.png')

	await page.locator('button:has-text("Save")').click()
	await page.waitForSelector('.cui-toaster-item')
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('05-after-save.png')
})

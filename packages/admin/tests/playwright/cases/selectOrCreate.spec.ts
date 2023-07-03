import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils.ts'
import * as modelDefinition from './selectOrCreate.model.ts'

let projectSlug: string

test.beforeAll(async ({ }, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('select or create', async ({ page }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/select-or-create`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('input#pw-title')
	expect(await page.screenshot()).toMatchSnapshot('01-initial.png')

	//
	await page.locator('.cui-selectCreateNewWrapper-button > button').click()
	await page.waitForSelector('input#pw-locale-code')
	await page.locator('input#pw-locale-code').fill('en')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('02-opened-dialog.png')


	await page.locator('#cui-portal-root button:has-text("OK")').click()
	await page.waitForSelector('input#pw-locale-code', { state: 'detached' })
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('03-item-added.png')

	//
	await page.locator('button:has-text("Save")').click()
	await page.waitForSelector('.cui-toaster-item')
	expect(await page.screenshot()).toMatchSnapshot('04-after-save.png')
})

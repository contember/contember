import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils'
import * as modelDefinition from './textInput.model'

let projectSlug: string

test.beforeAll(async ({}, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('basic test', async ({ page }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/text-input`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('input#pw-title')
	expect(await page.screenshot()).toMatchSnapshot('initial.png')

	await page.locator('input#pw-title').click()
	await page.locator('input#pw-title').fill('My First Article')
	await page.locator('button:has-text("Save")').click()
	await page.waitForSelector('.cui-toaster-item')
	expect(await page.screenshot()).toMatchSnapshot('after-save.png')
})

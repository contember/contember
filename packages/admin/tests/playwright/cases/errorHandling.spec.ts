import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils'
import * as modelDefinition from './errorHandling.model'

let projectSlug: string

test.beforeAll(async ({}, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('basic test', async ({ page }) => {
	await page.goto(`/${projectSlug}/error-handling`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('input#pw-title')

	await page.locator('input#pw-title').click()
	await page.locator('input#pw-title').fill('My First Article')
	await page.waitForTimeout(100)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('01-initial.png')
	await page.locator('button:has-text("Save")').click()
	await page.waitForSelector('.cui-toaster-item')

	await page.waitForTimeout(100)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('02-error.png')
})

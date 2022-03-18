import { expect, test } from '@playwright/test'
import { initContemberProject } from '../utils'
import * as modelDefinition from './textInput.model'

let projectSlug: string

test.beforeAll(async ({}, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('basic test', async ({ page }) => {
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.error(msg.text())
			test.fail()
		}
	})

	await page.goto(`/${projectSlug}/text-input`)
	await page.waitForLoadState('networkidle')
	await page.waitForTimeout(100)
	expect(await page.screenshot()).toMatchSnapshot('initial.png')

	await page.locator('input#pw-title').click()
	await page.locator('input#pw-title').fill('My First Article')
	await page.locator('button:has-text("Save")').click()
	await page.waitForLoadState('networkidle')
	await page.waitForTimeout(100)
	expect(await page.screenshot()).toMatchSnapshot('after-save.png')
})

import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject, sendContemberRequest } from '../utils'
import * as modelDefinition from './lazySelect.model'

let projectSlug: string

test.beforeAll(async ({}, testInfo) => {
	projectSlug = await initContemberProject(testInfo, modelDefinition)
})

test('lazy select', async ({ page }) => {
	expectNoConsoleErrors(page)
	for (const category of ['a', 'lorem ipsum']) {
		expect((await sendContemberRequest(`/content/${projectSlug}/live`, { category }, `
			mutation($category: String!) {
				createCategory(data: { name: $category }) {
					ok
				}
			}
		`)).data.createCategory.ok).toBe(true)
	}

	await page.goto(`/${projectSlug}/lazy-select`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('input#pw-title')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('01-initial.png')

	//
	await page.locator('.selectField-search-input').click()
	await page.waitForTimeout(100)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('02-expanded.png')
	//
	await page.locator('.selectField-search-input').fill('lorem')
	await page.waitForTimeout(500) // debounce
	await page.waitForLoadState('networkidle')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('03-loaded.png')
	//
	// await page.locator('#portal-root button:has-text("OK")').click()
	// await page.waitForSelector('input#pw-locale-code', { state: 'detached' })
	// await page.waitForTimeout(200)
	// expect(await page.screenshot()).toMatchSnapshot('03-item-added.png')
	//
	// //
	// await page.locator('button:has-text("Save")').click()
	// await page.waitForSelector('.cui-toaster-item')
	// expect(await page.screenshot()).toMatchSnapshot('04-after-save.png')
})

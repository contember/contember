import { SchemaDefinition as def } from '@contember/schema-definition'
import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors, initContemberProject } from '../utils.ts'

namespace Model {
	export class Dummy {
		dummy = def.stringColumn()
	}
}

let projectSlug: string

test.beforeAll(async ({ }, testInfo) => {
	projectSlug = await initContemberProject(testInfo, Model)
})

test('basic test', async ({ page, userAgent }) => {
	expectNoConsoleErrors(page)

	await page.goto(`/${projectSlug}/repeaterItemContainer`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('initial.png')

	await page.goto(`/${projectSlug}/repeaterItemContainerWithActions`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForTimeout(200)
	expect(await page.screenshot()).toMatchSnapshot('with-actions.png')
})

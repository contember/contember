import { expect, test } from '@playwright/test'
import { initContemberProject } from '../utils'
import * as modelDefinition from './blockEditor.model'

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

	await page.goto(`/${projectSlug}/block-editor`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('p.cui-editorParagraph')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('initial.png')
	await page.locator('p.cui-editorParagraph').click()
	await page.locator('p.cui-editorParagraph').fill('Hello world')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('filled.png')
	await page.locator('p.cui-editorParagraph').selectText()
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('selected.png')
})


test('inline buttons: ordered list', async ({ page }) => {
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.error(msg.text())
			test.fail()
		}
	})

	await page.goto(`/${projectSlug}/block-editor/inline-buttons-ordered-list`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('p.cui-editorParagraph')
	await page.locator('p.cui-editorParagraph').click()
	await page.keyboard.type('Hello world')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-ordered-list-initial.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 1)').click()
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-ordered-list-clicked.png')
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-ordered-list-first.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 2)').click()
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-ordered-list-second.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 3)').click()
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-ordered-list-third.png')
})


test('inline buttons: unordered list', async ({ page }) => {
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.error(msg.text())
			test.fail()
		}
	})

	await page.goto(`/${projectSlug}/block-editor/inline-buttons-unordered-list`)
	await page.waitForLoadState('networkidle') // wait for fonts
	await page.waitForSelector('p.cui-editorParagraph')
	await page.locator('p.cui-editorParagraph').click()
	await page.keyboard.type('Hello world')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-unordered-list-initial.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 1)').click()
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-unordered-list-clicked.png')
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-unordered-list-first.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 2)').click()
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-unordered-list-second.png')
	await page.locator(':nth-match(button.cui-editorToolbarButton, 3)').click()
	await page.locator('text=Hello world').click()
	await page.keyboard.press('End')
	for (let i = 0; i < 'world'.length; i++) {
		await page.keyboard.press('Shift+ArrowLeft')
		await page.waitForTimeout(200)
	}
	await page.waitForSelector('.cui-hoveringToolbar.is-active')
	await page.waitForTimeout(200)
	expect(await page.screenshot({ animations: 'disabled' })).toMatchSnapshot('inline-buttons-unordered-list-third.png')
})

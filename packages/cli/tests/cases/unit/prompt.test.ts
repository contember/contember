import { describe, expect, test } from 'bun:test'
import { Output, setColorsEnabled } from '@contember/cli-common'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import { promptConfirm, promptSelect } from '../../../src/lib/prompt/index.js'

setColorsEnabled(false)

const prompt = (answers: readonly string[]) => createTestOutput({ stdinTty: true, stderrTty: true, answers })

describe('promptConfirm', () => {
	test('accepts y, yes, n and no in any case', async () => {
		const confirm = (answer: string) => promptConfirm(prompt([answer]).output, { message: 'Continue?' })
		expect(await confirm('y')).toBe(true)
		expect(await confirm('YES')).toBe(true)
		expect(await confirm(' n ')).toBe(false)
		expect(await confirm('No')).toBe(false)
	})

	test('an empty line takes the initial value, which defaults to no', async () => {
		expect(await promptConfirm(prompt(['']).output, { message: 'Continue?' })).toBe(false)
		expect(await promptConfirm(prompt(['']).output, { message: 'Continue?', initial: true })).toBe(true)
	})

	test('asks again after an unknown answer', async () => {
		const { output, stderr } = prompt(['maybe', 'y'])
		expect(await promptConfirm(output, { message: 'Continue?' })).toBe(true)
		expect(stderr.text).toBe('Continue? (y/N) Continue? (y/N) ')
	})

	test('shows the default and answers no when the input is closed', async () => {
		const { output, stderr } = prompt([])
		expect(await promptConfirm(output, { message: 'Continue?', initial: true })).toBe(false)
		expect(stderr.text).toBe('Continue? (Y/n) ')
	})
})

describe('promptSelect', () => {
	const choose = (output: Output) =>
		promptSelect(output, {
			message: 'Choose an action',
			choices: [
				{ value: 'remove', title: 'Remove migration' },
				{ value: 'keep', title: 'Keep migration' },
			],
		})

	test('lists numbered choices and returns the picked value with its literal type', async () => {
		const { output, stderr } = prompt(['2'])
		const selected: 'remove' | 'keep' | undefined = await choose(output)
		expect(selected).toBe('keep')
		expect(stderr.text).toBe('Choose an action\n  1) Remove migration\n  2) Keep migration\nChoose 1-2: ')
	})

	test('asks again after an empty, out-of-range or non-numeric answer', async () => {
		const { output, stderr } = prompt(['', '0', '3', '1.0', 'keep', ' 1 '])
		expect(await choose(output)).toBe('remove')
		expect(stderr.text.split('Choose 1-2: ').length - 1).toBe(1)
		expect(stderr.text.split('Enter a number from 1 to 2: ').length - 1).toBe(5)
	})

	test('returns undefined when the input is closed', async () => {
		expect(await choose(prompt([]).output)).toBeUndefined()
	})
})

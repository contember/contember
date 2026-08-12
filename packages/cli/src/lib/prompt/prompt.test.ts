import { describe, expect, test } from 'bun:test'
import { Output, type OutputStream } from '@contember/cli-common'
import { promptConfirmWithRunner, promptSelectWithRunner } from './prompt.internal.js'

class CapturingStream implements OutputStream {
	public readonly isTty = true
	public readonly columns = 120

	public write(): void {
	}
}

const createOutput = (): Output => new Output({
	stdout: new CapturingStream(),
	stderr: new CapturingStream(),
	isStdinTty: () => true,
})

describe('promptConfirm', () => {
	test('binds diagnostic output and maps a confirmed answer', async () => {
		const output = createOutput()
		const result = await promptConfirmWithRunner(output, { message: 'Continue?', initial: false }, async question => {
			expect(question).toStrictEqual({
				type: 'confirm',
				name: 'value',
				message: 'Continue?',
				initial: false,
				stdout: output.promptOutput,
			})
			return { value: true }
		})

		expect(result).toBe(true)
	})

	test('maps rejection and cancellation to false', async () => {
		const output = createOutput()
		expect(await promptConfirmWithRunner(output, { message: 'Continue?' }, async question => {
			expect(question).toStrictEqual({
				type: 'confirm',
				name: 'value',
				message: 'Continue?',
				stdout: output.promptOutput,
			})
			expect('initial' in question).toBe(false)
			return { value: false }
		})).toBe(false)
		expect(await promptConfirmWithRunner(output, { message: 'Continue?' }, async () => ({}))).toBe(false)
	})

	test('propagates runner rejection unchanged', async () => {
		const output = createOutput()
		const rejection = new Error('prompt failed')
		const promise = promptConfirmWithRunner(output, { message: 'Continue?' }, async () => {
			throw rejection
		})

		await expect(promise).rejects.toBe(rejection)
	})
})

describe('promptSelect', () => {
	test('preserves literal values, binds diagnostic output, and maps the answer', async () => {
		const output = createOutput()
		const selected = await promptSelectWithRunner(output, {
			message: 'Choose an action',
			choices: [
				{ value: 'remove', title: 'Remove migration' },
				{ value: 'keep', title: 'Keep migration' },
			],
		}, async question => {
			expect(question.type).toBe('select')
			expect(question.name).toBe('value')
			expect(question.message).toBe('Choose an action')
			expect(question.choices).toStrictEqual([
				{ value: 'remove', title: 'Remove migration' },
				{ value: 'keep', title: 'Keep migration' },
			])
			expect(question.stdout).toBe(output.promptOutput)
			return { value: 'remove' }
		})
		const typedSelection: 'remove' | 'keep' | undefined = selected

		expect(typedSelection).toBe('remove')
	})

	test('returns undefined for cancellation and unknown answers', async () => {
		const output = createOutput()
		const options = {
			message: 'Choose an action',
			choices: [{ value: 'keep', title: 'Keep migration' }],
		}

		expect(await promptSelectWithRunner(output, options, async () => ({}))).toBeUndefined()
		expect(await promptSelectWithRunner(output, options, async () => ({ value: 'unexpected' }))).toBeUndefined()
	})
})

import { describe, expect, test } from 'bun:test'
import { MigrationExecuteCommand } from '../../../src/commands/migrations/MigrationExecuteCommand.js'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

type ExecuteOptions = Parameters<MigrationExecutionFacade['execute']>[0]

const createCommand = (changed: boolean) => {
	const calls: ExecuteOptions[] = []
	const command = new MigrationExecuteCommand({
		execute: async options => {
			calls.push(options)
			return changed
		},
	})
	return { command, calls }
}

describe('MigrationExecuteCommand', () => {
	test('reports the completed status and forwards execution flags in JSON mode', async () => {
		const { command, calls } = createCommand(true)
		const { output, stdout, stderr } = createTestOutput()

		expect(
			await command.run(
				['--json', '--yes', '--force', '--until', '2025-01-01-000001-first', '--no-snapshot'],
				output,
			),
		).toBe(0)
		expect(JSON.parse(stdout.text)).toStrictEqual({ status: 'completed', until: '2025-01-01-000001-first' })
		expect(stderr.text).toBe('')
		expect(calls).toStrictEqual([
			{
				force: true,
				until: '2025-01-01-000001-first',
				requireConfirmation: false,
				useSnapshot: false,
			},
		])
	})

	test('reports a no-op as a quiet scalar', async () => {
		const { command, calls } = createCommand(false)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--quiet', '--yes'], output)).toBe(0)
		expect(stdout.text).toBe('noop\n')
		expect(stderr.text).toBe('')
		expect(calls).toStrictEqual([
			{
				force: undefined,
				until: undefined,
				requireConfirmation: false,
				useSnapshot: true,
			},
		])
	})
})

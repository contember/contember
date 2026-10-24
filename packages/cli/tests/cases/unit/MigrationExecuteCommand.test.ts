import { describe, expect, test } from 'bun:test'
import { MigrationExecuteCommand } from '../../../src/commands/migrations/MigrationExecuteCommand.js'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'
import type { EnvelopeCoverageResult } from '../../../src/lib/tenant/workloadIdentity/envelopeCoverage.js'

type ExecuteOptions = Parameters<MigrationExecutionFacade['execute']>[0]

const createCommand = (changed: boolean, envelopeCoverage?: EnvelopeCoverageResult) => {
	const calls: ExecuteOptions[] = []
	const command = new MigrationExecuteCommand({
		execute: async options => {
			calls.push(options)
			if (envelopeCoverage !== undefined) {
				options.onEnvelopeCoverage?.(envelopeCoverage)
			}
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
		expect(JSON.parse(stdout.text)).toStrictEqual({ status: 'completed', until: '2025-01-01-000001-first', envelopeCoverage: null })
		expect(stderr.text).toBe('')
		expect(calls).toStrictEqual([
			{
				force: true,
				until: '2025-01-01-000001-first',
				requireConfirmation: false,
				useSnapshot: false,
				onEnvelopeCoverage: expect.any(Function),
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
				onEnvelopeCoverage: expect.any(Function),
			},
		])
	})

	// diagnostics never reach a --json caller, so uncovered envelope rules must travel in the payload
	test('carries the envelope coverage result in the JSON payload', async () => {
		const envelopeCoverage: EnvelopeCoverageResult = {
			status: 'checked',
			issues: [{ trust: 'sites-sync', project: 'sites', membershipRole: 'sync', targetRole: 'editor', kind: 'role-missing' }],
		}
		const { command } = createCommand(true, envelopeCoverage)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--json', '--yes'], output)).toBe(0)
		expect(JSON.parse(stdout.text)).toStrictEqual({ status: 'completed', until: null, envelopeCoverage })
		expect(stderr.text).toBe('')
	})
})

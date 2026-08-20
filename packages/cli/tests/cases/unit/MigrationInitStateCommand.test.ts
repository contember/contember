import { afterEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { SchemaStateManager } from '@contember/migrations-client'
import { emptySchema } from '@contember/schema-utils'
import { MigrationInitStateCommand } from '../../../src/commands/migrations/MigrationInitStateCommand.js'
import { SchemaLoader } from '../../../src/lib/schema/SchemaLoader.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(directory => fs.rm(directory, { recursive: true, force: true })))
})

const createCommand = async (enabled = false): Promise<MigrationInitStateCommand> => {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-init-state-command-'))
	temporaryDirectories.push(directory)
	const stateManager = new SchemaStateManager(path.join(directory, 'state'))
	if (enabled) {
		await stateManager.extractState(emptySchema)
	}
	const schemaLoader: SchemaLoader = { loadSchema: async () => emptySchema }
	return new MigrationInitStateCommand(schemaLoader, stateManager)
}

describe('MigrationInitStateCommand', () => {
	test('keeps status messages as human diagnostics', async () => {
		const command = await createCommand()
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run([], output)).toBe(0)
		expect(stdout.text).toBe('')
		expect(stderr.lines).toStrictEqual([
			'Schema state mode enabled. ACL, validation, actions and settings are now managed in the state/ directory.',
			'These parts of the schema will no longer be written into migrations.',
		])
	})

	test('reports a changed result as JSON', async () => {
		const command = await createCommand()
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--json'], output)).toBe(0)
		expect(JSON.parse(stdout.text)).toStrictEqual({ enabled: true, changed: true })
		expect(stderr.text).toBe('')
	})

	test('reports an already enabled result as JSON', async () => {
		const command = await createCommand(true)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--json'], output)).toBe(0)
		expect(JSON.parse(stdout.text)).toStrictEqual({ enabled: true, changed: false })
		expect(stderr.text).toBe('')
	})

	test('projects the changed flag in quiet mode', async () => {
		const command = await createCommand()
		const changed = createTestOutput()

		expect(await command.run(['--quiet'], changed.output)).toBe(0)
		expect(changed.stdout.text).toBe('true\n')
		expect(changed.stderr.text).toBe('')

		const unchanged = createTestOutput()
		expect(await command.run(['--quiet'], unchanged.output)).toBe(0)
		expect(unchanged.stdout.text).toBe('false\n')
		expect(unchanged.stderr.text).toBe('')
	})
})

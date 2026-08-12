import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import prompts from 'prompts'
import { JsonLoader, MigrationFilesManager, MigrationParser, MigrationsResolver, VERSION_LATEST } from '@contember/migrations-client'
import { CliError, ExitCode } from '@contember/cli-common'
import { MigrationRebaseCommand } from '../../../src/commands/migrations/MigrationRebaseCommand.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

let workDir: string

beforeEach(async () => {
	workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-rebase-command-'))
})

afterEach(async () => {
	await fs.rm(workDir, { recursive: true, force: true })
})

const buildCommand = async () => {
	const filesManager = new MigrationFilesManager(workDir, { json: new JsonLoader(new MigrationParser()) })
	await filesManager.createFile(
		JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }),
		'2024-01-01-120000-existing',
	)
	const resolver = new MigrationsResolver(filesManager)
	let calls = 0
	const command = new MigrationRebaseCommand(resolver, {
		rebase: async () => {
			calls++
		},
	})
	return { command, getCalls: () => calls }
}

test('non-interactive rebase refusal returns an input error without rewriting migrations', async () => {
	const { command, getCalls } = await buildCommand()
	const before = await fs.readdir(workDir)
	const { output } = createTestOutput({ stdinTty: false })

	const error = await command.run(['2024-01-01-120000'], output).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('TTY_UNAVAILABLE')
	expect(error instanceof CliError ? error.exitCode : null).toBe(ExitCode.InputError)
	expect(getCalls()).toBe(0)
	expect(await fs.readdir(workDir)).toStrictEqual(before)
})

test('declining rebase returns OPERATION_ABORTED without invoking the facade', async () => {
	const { command, getCalls } = await buildCommand()
	const { output } = createTestOutput({ stdinTty: true })
	prompts.inject([false])

	const error = await command.run(['2024-01-01-120000'], output).then(() => null, (reason: unknown) => reason)

	expect(error instanceof CliError ? error.code : null).toBe('OPERATION_ABORTED')
	expect(getCalls()).toBe(0)
})

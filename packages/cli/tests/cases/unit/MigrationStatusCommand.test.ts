import { describe, expect, test } from 'bun:test'
import {
	AnyMigrationStatus,
	ErrorMigrationStatus,
	ExecutedMigration,
	MigrationFile,
	MigrationState,
	MigrationToExecuteOkStatus,
} from '@contember/migrations-client'
import { MigrationStatusCommand } from '../../../src/commands/migrations/MigrationStatusCommand.js'
import { MigrationStatusRow } from '../../../src/lib/migrations/MigrationPrinter.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

interface StatusResult {
	allMigrations: AnyMigrationStatus[]
	errorMigrations: ErrorMigrationStatus[]
	migrationsToExecute: MigrationToExecuteOkStatus[]
}

const executedAt = new Date('2025-01-02T03:04:05.000Z')
const localMigration: MigrationFile = {
	path: '/migrations/2025-01-01-000001-pending.json',
	version: '2025-01-01-000001',
	name: '2025-01-01-000001-pending',
	getContent: async () => ({
		type: 'schema',
		name: '2025-01-01-000001-pending',
		version: '2025-01-01-000001',
		formatVersion: 1,
		modifications: [],
	}),
}
const executedMigration = {
	name: '2025-01-01-000002-executed',
	version: '2025-01-01-000002',
	formatVersion: 1,
	checksum: 'checksum',
	executedAt,
}

const toExecute: MigrationToExecuteOkStatus = {
	state: MigrationState.TO_EXECUTE_OK,
	version: localMigration.version,
	name: localMigration.name,
	localMigration,
}
const executedMissing: ErrorMigrationStatus = {
	state: MigrationState.EXECUTED_MISSING,
	version: executedMigration.version,
	name: executedMigration.name,
	executedMigration,
	errorMessage: `Migration ${executedMigration.name} is missing locally`,
}
const executedOk: AnyMigrationStatus = {
	state: MigrationState.EXECUTED_OK,
	version: '2025-01-01-000003',
	name: '2025-01-01-000003-executed-ok',
	executedMigration: { ...executedMigration, version: '2025-01-01-000003', name: '2025-01-01-000003-executed-ok' },
	localMigration,
}
const executedError: ErrorMigrationStatus = {
	state: MigrationState.EXECUTED_ERROR,
	version: '2025-01-01-000004',
	name: '2025-01-01-000004-executed-error',
	executedMigration: { ...executedMigration, version: '2025-01-01-000004', name: '2025-01-01-000004-executed-error' },
	localMigration,
	errorMessage: 'Checksum mismatch',
}
const toExecuteError: ErrorMigrationStatus = {
	state: MigrationState.TO_EXECUTE_ERROR,
	version: '2025-01-01-000005',
	name: '2025-01-01-000005-pending-error',
	localMigration,
	errorMessage: 'Must follow latest',
}
const skipped: AnyMigrationStatus = {
	state: MigrationState.SKIP_EMPTY,
	version: '2025-01-01-000006',
	name: '2025-01-01-000006-empty',
	localMigration,
}
const everyState = [toExecute, executedMissing, executedOk, executedError, toExecuteError, skipped]
const everyError = [executedMissing, executedError, toExecuteError]

const statusRows = (migrations: AnyMigrationStatus[]): MigrationStatusRow[] =>
	migrations.map(migration => ({
		status: migration.state,
		migration: migration.name,
		info: 'status info',
	}))

const createCommand = (
	initialStatus: StatusResult,
	restoredStatus: StatusResult = initialStatus,
	fullMigration: ExecutedMigration = { ...executedMigration, modifications: [] },
) => {
	const requestedOptions: Array<{ allowError?: boolean }> = []
	const writes: Array<{ content: string; name: string }> = []
	let statusCalls = 0
	const command = new MigrationStatusCommand(
		{
			resolveMigrationsStatus: async options => {
				requestedOptions.push(options)
				return statusCalls++ === 0 ? initialStatus : restoredStatus
			},
		},
		{
			createFile: async (content, name) => {
				writes.push({ content, name })
				return `/migrations/${name}.json`
			},
		},
		{
			get: () => ({
				getExecutedMigration: async () => fullMigration,
			}),
		},
		{ statusRows },
	)
	return { command, requestedOptions, writes }
}

describe('MigrationStatusCommand', () => {
	test('emits every status row as structured JSON', async () => {
		const status = {
			allMigrations: everyState,
			errorMigrations: everyError,
			migrationsToExecute: [toExecute],
		}
		const { command } = createCommand(status)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--json'], output)).toBe(1)
		expect(JSON.parse(stdout.text)).toStrictEqual(everyState.map(migration => ({
			status: migration.state,
			migration: migration.name,
			info: 'status info',
		})))
		expect(stderr.text).toBe('')
	})

	test('quiet output contains only migration names and preserves the error exit status', async () => {
		const status = {
			allMigrations: everyState,
			errorMigrations: everyError,
			migrationsToExecute: [toExecute],
		}
		const { command } = createCommand(status)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--quiet'], output)).toBe(1)
		expect(stdout.lines).toStrictEqual(everyState.map(migration => migration.name))
		expect(stderr.text).toBe('')
	})

	test('filters pending migrations without hiding unrelated errors from the exit status', async () => {
		const status = {
			allMigrations: [toExecute, executedMissing],
			errorMigrations: [executedMissing],
			migrationsToExecute: [toExecute],
		}
		const { command } = createCommand(status)
		const { output, stdout } = createTestOutput()

		expect(await command.run(['--json', '--only-to-execute'], output)).toBe(1)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ status: MigrationState.TO_EXECUTE_OK, migration: toExecute.name, info: 'status info' },
		])
	})

	test('restores a missing migration and renders the refreshed status', async () => {
		const initialStatus = {
			allMigrations: [executedMissing],
			errorMigrations: [executedMissing],
			migrationsToExecute: [],
		}
		const restored = {
			allMigrations: [],
			errorMigrations: [],
			migrationsToExecute: [],
		}
		const fullMigration: ExecutedMigration = { ...executedMigration, modifications: [{ modification: 'createEntity', entityName: 'Article' }] }
		const { command, requestedOptions, writes } = createCommand(initialStatus, restored, fullMigration)
		const { output, stdout, stderr } = createTestOutput()

		expect(await command.run(['--json', '--restore-missing'], output)).toBe(0)
		expect(JSON.parse(stdout.text)).toStrictEqual([])
		expect(stderr.text).toBe('')
		expect(requestedOptions).toStrictEqual([{ allowError: true }, {}])
		expect(writes).toStrictEqual([
			{
				name: executedMigration.name,
				content: JSON.stringify({ formatVersion: 1, modifications: fullMigration.modifications }, undefined, '\t') + '\n',
			},
		])
	})
})

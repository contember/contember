import { afterEach, beforeEach, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Schema } from '@contember/schema'
import { SchemaStateManager } from '@contember/migrations-client'
import { MigrationExecutionFacade } from '../../../src/lib/migrations/MigrationExecutionFacade.js'

namespace BlogModel {
	export class Author {
		name = def.stringColumn()
	}
}

const aclWith = (role: string): Schema['acl'] => ({
	roles: { [role]: { variables: {}, stages: '*', entities: {} } },
})

let migrationsDir: string

beforeEach(async () => {
	migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-exec-'))
	await new SchemaStateManager(path.join(migrationsDir, 'state')).extractState({ ...createSchema(BlogModel), acl: aclWith('admin') })
})

afterEach(async () => {
	await fs.rm(migrationsDir, { recursive: true, force: true })
})

// Drives MigrationExecutionFacade.execute with a recording migration executor and a real state manager.
// Returns the schemaState the executor was handed plus everything written to console.log.
const runExecute = async (opts: { until?: string }) => {
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	let executedSchemaState: unknown = 'not-called'
	const migrationExecutor = {
		executeMigrations: async (args: any) => {
			executedSchemaState = args.schemaState
		},
	}
	const status = {
		migrationsToExecute: [{ version: '2024-01-01-120000', name: '2024-01-01-120000-init', localMigration: {} }],
	}

	const facade = new MigrationExecutionFacade(
		{ get: () => ({ listExecutedMigrations: async () => [] }) } as any, // systemClientProvider
		{ get: () => ({ createProject: async () => {} }) } as any, // tenantClientProvider
		{ get: () => ({ name: 'p', token: 't', endpoint: 'e' }) } as any, // projectProvider
		{} as any, // schemaVersionBuilder (only used in the describe prompt path)
		{} as any, // migrationPrinter
		migrationExecutor as any,
		{ resolveMigrationsStatus: async () => status } as any,
		schemaStateManager,
		{ getUsableSnapshot: async () => null } as any, // migrationSnapshotFacade — these tests exercise the no-snapshot path
	)

	const logs: string[] = []
	const original = console.log
	console.log = (...args: any[]) => logs.push(args.join(' '))
	try {
		await facade.execute({ requireConfirmation: false, ...opts })
	} finally {
		console.log = original
	}
	return { executedSchemaState, logs }
}

test('does not push schema state when --until targets a specific migration, and warns', async () => {
	const { executedSchemaState, logs } = await runExecute({ until: '2024-01-01-120000' })

	expect(executedSchemaState).toBeUndefined()
	expect(logs.some(it => it.includes('Warning') && it.includes('--until'))).toBe(true)
})

test('pushes schema state when no --until is given', async () => {
	const { executedSchemaState, logs } = await runExecute({})

	expect(executedSchemaState).toBeDefined()
	expect(Object.keys((executedSchemaState as any).acl.roles)).toStrictEqual(['admin'])
	expect(logs.some(it => it.includes('Warning'))).toBe(false)
})

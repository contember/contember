import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { c, createSchema } from '@contember/schema-definition'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import {
	JsonLoader,
	MigrationCreator,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
	VERSION_LATEST,
} from '@contember/migrations-client'
import { Input } from '@contember/cli-common'
import { MigrationAmendCommand } from '../../../src/commands/migrations/MigrationAmendCommand'
import { SchemaLoader } from '../../../src/lib/schema/SchemaLoader'

namespace BlogModel {
	export class Author {
		name = c.stringColumn()
	}
}

namespace BlogModelExtended {
	export class Author {
		name = c.stringColumn()
		nickname = c.stringColumn()
	}
}

const aclWith = (role: string): Schema['acl'] => ({
	roles: {
		[role]: { variables: {}, stages: '*', entities: {} },
	},
})

type SystemClientCall = { method: 'migrate' | 'migrationDelete' | 'migrationModify'; args: any[] }

// A system client that records calls instead of hitting the network. `get()` throws by default so a
// state-only amend (which must not touch the server) fails loudly if it ever reaches out.
const recordingSystemClient = (calls?: SystemClientCall[]) => ({
	get: () => {
		if (!calls) {
			throw new Error('systemClient must not be used for a state-only amend')
		}
		const record = (method: SystemClientCall['method']) => async (...args: any[]) => {
			calls.push({ method, args })
		}
		return { migrate: record('migrate'), migrationDelete: record('migrationDelete'), migrationModify: record('migrationModify') }
	},
})

// Builds an amend command wired with real migrations-client services backed by `migrationsDir`.
const buildCommand = (migrationsDir: string, loadedSchema: Schema, calls?: SystemClientCall[]) => {
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager)
	const migrationCreator = new MigrationCreator(filesManager, new SchemaDiffer(schemaMigrator))

	const schemaLoader: SchemaLoader = { loadSchema: async () => loadedSchema }
	const statusFacade = { resolveMigrationsStatus: async () => ({ migrationsToExecute: [] }) }
	const migrationsValidator = { validate: async () => true }
	const migrationPrinter = { printMigrationDescription: () => {} }

	const command = new MigrationAmendCommand(
		migrationsResolver,
		recordingSystemClient(calls) as any,
		statusFacade as any,
		schemaLoader,
		schemaVersionBuilder,
		migrationCreator,
		migrationsValidator as any,
		migrationPrinter as any,
		schemaMigrator,
		schemaStateManager,
	)
	return { command, schemaStateManager }
}

const run = (command: MigrationAmendCommand) => command.execute(new Input({}, { force: false, yes: true }))

describe('MigrationAmendCommand (schema state mode)', () => {
	let migrationsDir: string

	beforeEach(async () => {
		migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-amend-'))

		const schemaDiffer = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
		const model = createSchema(BlogModel)
		// model-only migration, exactly as state mode would produce (non-model parts live in state/ files)
		const modifications = schemaDiffer.diffSchemas(emptySchema, model, { skipNonModelDiffers: true })
		await fs.writeFile(
			path.join(migrationsDir, '2024-01-01-120000-init.json'),
			JSON.stringify({ formatVersion: VERSION_LATEST, modifications }, null, '\t'),
		)

		// enable state mode with an initial ACL granting the `admin` role
		const stateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
		await stateManager.extractState({ ...model, acl: aclWith('admin') })
	})

	afterEach(async () => {
		await fs.rm(migrationsDir, { recursive: true, force: true })
	})

	test('rewrites state files when only non-model parts changed', async () => {
		const model = createSchema(BlogModel)
		// same model, different ACL — the diff is non-model only, so no migration is produced
		const { command, schemaStateManager } = buildCommand(migrationsDir, { ...model, acl: aclWith('editor') })

		const code = await run(command)

		expect(code).toBe(0)
		const state = await schemaStateManager.readState()
		expect(Object.keys(state.acl.roles)).toStrictEqual(['editor'])
	})

	test('leaves state untouched when nothing changed', async () => {
		const model = createSchema(BlogModel)
		// identical model and ACL — nothing to do, state files must not be rewritten
		const { command, schemaStateManager } = buildCommand(migrationsDir, { ...model, acl: aclWith('admin') })

		const code = await run(command)

		expect(code).toBe(0)
		const state = await schemaStateManager.readState()
		expect(Object.keys(state.acl.roles)).toStrictEqual(['admin'])
	})

	test('re-pushes schema state to the server after amending model changes', async () => {
		// model changed (a column added) — migrationModify rebuilds the server schema from migrations
		// and drops the non-model state, so amend must re-apply the state via a follow-up migrate call.
		const loaded: Schema = { ...createSchema(BlogModelExtended), acl: aclWith('admin') }
		const calls: SystemClientCall[] = []
		const { command } = buildCommand(migrationsDir, loaded, calls)

		const code = await run(command)

		expect(code).toBe(0)
		const modifyIndex = calls.findIndex(it => it.method === 'migrationModify')
		expect(modifyIndex).toBeGreaterThanOrEqual(0)
		// the state re-push is a migrate call carrying schemaState, after the migrationModify
		const restate = calls.slice(modifyIndex + 1).find(it => it.method === 'migrate' && it.args[2])
		expect(restate).toBeDefined()
		expect(Object.keys(restate!.args[2].acl.roles)).toStrictEqual(['admin'])
	})
})

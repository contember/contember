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

const aclWith = (role: string): Schema['acl'] => ({
	roles: {
		[role]: { variables: {}, stages: '*', entities: {} },
	},
})

// Builds an amend command wired with real migrations-client services backed by `migrationsDir`.
// The network-bound collaborators are stubbed: a state-only amend must return before any of them is used.
const buildCommand = (migrationsDir: string, loadedSchema: Schema) => {
	const filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
	const migrationsResolver = new MigrationsResolver(filesManager)
	const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	const schemaStateManager = new SchemaStateManager(path.join(migrationsDir, 'state'))
	const schemaVersionBuilder = new SchemaVersionBuilder(migrationsResolver, schemaMigrator, schemaStateManager)
	const migrationCreator = new MigrationCreator(filesManager, new SchemaDiffer(schemaMigrator))

	const schemaLoader: SchemaLoader = { loadSchema: async () => loadedSchema }
	const statusFacade = { resolveMigrationsStatus: async () => ({ migrationsToExecute: [] }) }
	const systemClientProvider = {
		get: () => {
			throw new Error('systemClient must not be used for a state-only amend')
		},
	}
	const migrationsValidator = { validate: async () => true }
	const migrationPrinter = { printMigrationDescription: () => {} }

	const command = new MigrationAmendCommand(
		migrationsResolver,
		systemClientProvider as any,
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
})

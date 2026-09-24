import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import {
	JsonLoader,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	SchemaStateManager,
	SchemaVersionBuilder,
} from '../../../src/index.js'
import { Migration, ModificationHandlerFactory, SchemaMigrator } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { Schema } from '@contember/schema'

const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))

// No migrations on disk — buildSchemaAdvanced reduces to the initial (empty) schema, isolating the state-merge behavior.
const emptyResolver = { getSchemaMigrations: async () => [] } as unknown as MigrationsResolver

const stateAcl: Schema['acl'] = { roles: { admin: { variables: {}, stages: '*', entities: {} } } }

describe('SchemaVersionBuilder schema state merge', () => {
	let baseDir: string
	let stateDir: string
	let stateManager: SchemaStateManager

	beforeEach(async () => {
		baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-svb-'))
		stateDir = path.join(baseDir, 'state')
		stateManager = new SchemaStateManager(stateDir)
	})

	afterEach(async () => {
		await fs.rm(baseDir, { recursive: true, force: true })
	})

	test('buildSchema does not merge state when state mode is off', async () => {
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		const schema = await builder.buildSchema()

		expect(schema.acl).toStrictEqual(emptySchema.acl)
	})

	test('buildSchema merges state from disk when state mode is on', async () => {
		await stateManager.extractState({ ...emptySchema, acl: stateAcl })
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		const schema = await builder.buildSchema()

		expect(schema.acl).toStrictEqual(stateAcl)
	})

	test('buildSchema with a target version skips the state merge', async () => {
		await stateManager.extractState({ ...emptySchema, acl: stateAcl })
		const builder = new SchemaVersionBuilder(emptyResolver, schemaMigrator, stateManager)

		// The merge is guarded by `!targetVersion`, so requesting a historical version must not pull in current state.
		const schema = await builder.buildSchema('2024-01-01-000000')

		expect(schema.acl).toStrictEqual(emptySchema.acl)
	})
})

class CountingSchemaMigrator extends SchemaMigrator {
	public appliedMigrations = 0

	constructor() {
		super(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
	}

	public override applyModifications(schema: Schema, diff: readonly Migration.Modification[], formatVersion: number): Schema {
		this.appliedMigrations++
		return super.applyModifications(schema, diff, formatVersion)
	}
}

describe('SchemaVersionBuilder buildSchemaUntil', () => {
	let migrationsDir: string
	let filesManager: MigrationFilesManager
	let migrator: CountingSchemaMigrator
	let builder: SchemaVersionBuilder

	const createEnumMigration = (version: string, enumName: string) =>
		filesManager.createFile(
			JSON.stringify({ formatVersion: 6, modifications: [{ modification: 'createEnum', enumName, values: ['a'] }] }),
			`${version}-${enumName}`,
		)
	const enumNames = (schema: Schema) => Object.keys(schema.model.enums)

	beforeEach(async () => {
		migrationsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-svb-until-'))
		filesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
		migrator = new CountingSchemaMigrator()
		builder = new SchemaVersionBuilder(new MigrationsResolver(filesManager), migrator, new SchemaStateManager(path.join(migrationsDir, 'state')))
		await createEnumMigration('2024-01-01-000000', 'first')
		await createEnumMigration('2024-01-02-000000', 'second')
		await createEnumMigration('2024-01-03-000000', 'third')
	})

	afterEach(async () => {
		await fs.rm(migrationsDir, { recursive: true, force: true })
	})

	test('continues from the previous build for an ascending target', async () => {
		expect(enumNames(await builder.buildSchemaUntil('2024-01-02-000000'))).toStrictEqual(['first'])
		expect(enumNames(await builder.buildSchemaUntil('2024-01-04-000000'))).toStrictEqual(['first', 'second', 'third'])
		expect(migrator.appliedMigrations).toBe(3)
	})

	test('rebuilds from scratch for a descending target', async () => {
		await builder.buildSchemaUntil('2024-01-04-000000')

		expect(enumNames(await builder.buildSchemaUntil('2024-01-02-000000'))).toStrictEqual(['first'])
	})

	test('rebuilds from scratch when the migration files change', async () => {
		await builder.buildSchemaUntil('2024-01-03-000000')
		await createEnumMigration('2024-01-01-120000', 'inserted')

		expect(enumNames(await builder.buildSchemaUntil('2024-01-04-000000'))).toStrictEqual(['first', 'inserted', 'second', 'third'])
	})
})

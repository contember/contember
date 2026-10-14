import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { JsonLoader, MigrationFilesManager, MigrationParser, MigrationsResolver, SchemaVersionBuilder } from '../../../src'
import { Migration, ModificationHandlerFactory, SchemaMigrator } from '@contember/schema-migrations'
import { Schema } from '@contember/schema'

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
		builder = new SchemaVersionBuilder(new MigrationsResolver(filesManager), migrator)
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

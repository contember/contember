import { describe, expect, test } from 'bun:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	JsonLoader,
	MigrationFilesManager,
	MigrationParser,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaStateManager,
	SchemaVersionBuilder,
} from '@contember/migrations-client'
import { schemaType } from '@contember/schema-utils'
import schema from '../api/index.js'

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../api/migrations')

describe('playground migrations', () => {
	test('replaying the schema migrations yields the current schema', async () => {
		const schemaMigrator = new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
		const migrationFilesManager = new MigrationFilesManager(migrationsDir, { json: new JsonLoader(new MigrationParser()) })
		const schemaVersionBuilder = new SchemaVersionBuilder(
			new MigrationsResolver(migrationFilesManager),
			schemaMigrator,
			new SchemaStateManager(join(migrationsDir, 'state')),
		)

		const replayed = await schemaVersionBuilder.buildSchema()
		// normalize the schema the way the CLI loads it
		expect(new SchemaDiffer(schemaMigrator).diffSchemas(replayed, schemaType(schema))).toEqual([])
	})
})

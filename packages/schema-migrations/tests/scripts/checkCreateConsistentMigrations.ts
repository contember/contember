import { relative } from 'path'
import {
	MigrationFilesManager,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '../../src'
import { emptySchema } from '@contember/schema-utils'
;(async () => {
	const migrationsResolver = new MigrationsResolver(new MigrationFilesManager(relative(process.cwd(), process.argv[2])))
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const differ = new SchemaDiffer(new SchemaMigrator(modificationHandlerFactory))
	const migrator = new SchemaMigrator(modificationHandlerFactory)
	let schema = emptySchema
	for (const migration of await migrationsResolver.getMigrations()) {
		const nextSchema = migrator.applyModifications(schema, migration.modifications, migration.formatVersion)
		differ.diffSchemas(schema, nextSchema)

		schema = nextSchema
	}
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})

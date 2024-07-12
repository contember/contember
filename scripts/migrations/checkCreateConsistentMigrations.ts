import { relative } from 'node:path'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, } from '../../packages/schema-migrations/src'
import { emptySchema, schemaType } from '@contember/schema-utils';
import { MigrationsResolver } from "../../packages/cli/src/lib/migrations/MigrationsResolver";
import { MigrationFilesManager } from "../../packages/cli/src/lib/migrations/MigrationFilesManager";

(async () => {
	// eslint-disable-next-line no-console
	console.log(relative(process.cwd(), process.argv[2]))
	const migrationsResolver = new MigrationsResolver(new MigrationFilesManager(relative(process.cwd(), process.argv[2])))
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const differ = new SchemaDiffer(new SchemaMigrator(modificationHandlerFactory))
	const migrator = new SchemaMigrator(modificationHandlerFactory)
	let schema = emptySchema
	for (const migration of await migrationsResolver.getSchemaMigrations()) {
		const nextSchema = migrator.applyModifications(schema, migration.modifications, migration.formatVersion)
		schemaType(nextSchema)
		const nextSchemaWithoutMeta = nextSchema
		differ.diffSchemas(schema, nextSchemaWithoutMeta)

		schema = nextSchema
	}
	// eslint-disable-next-line no-console
	console.log('OK')
})().catch(e => {
	// eslint-disable-next-line no-console
	console.error(e)
	process.exit(1)
})

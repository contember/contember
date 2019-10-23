import { Builder } from '@contember/dic'
import { MigrationFilesManager } from '@contember/engine-common/dist/src/migrations/MigrationFilesManager'
import {
	MigrationDiffCreator,
	MigrationSqlDryRunner,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaVersionBuilder,
} from '@contember/schema-migrations'

export interface MigrationsContainer {
	migrationDiffCreator: MigrationDiffCreator
	migrationDryRunner: MigrationSqlDryRunner
}

export class MigrationsContainerFactory {
	constructor(private readonly directory: string) {}

	public create(): MigrationsContainer {
		return new Builder({})
			.addService('migrationFilesManager', () => new MigrationFilesManager(this.directory))
			.addService(
				'modificationHandlerFactory',
				() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
			)
			.addService('schemaMigrator', ({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory))
			.addService('migrationsResolver', ({ migrationFilesManager }) => new MigrationsResolver(migrationFilesManager))
			.addService(
				'schemaVersionBuilder',
				({ migrationsResolver, schemaMigrator }) => new SchemaVersionBuilder(migrationsResolver, schemaMigrator),
			)
			.addService('schemaDiffer', ({ schemaMigrator }) => new SchemaDiffer(schemaMigrator))
			.addService(
				'migrationDiffCreator',
				({ migrationFilesManager, schemaVersionBuilder, schemaDiffer }) =>
					new MigrationDiffCreator(migrationFilesManager, schemaVersionBuilder, schemaDiffer),
			)
			.addService(
				'migrationDryRunner',
				({ migrationsResolver, modificationHandlerFactory, schemaVersionBuilder }) =>
					new MigrationSqlDryRunner(migrationsResolver, modificationHandlerFactory, schemaVersionBuilder),
			)
			.build()
			.pick('migrationDiffCreator', 'migrationDryRunner')
	}
}

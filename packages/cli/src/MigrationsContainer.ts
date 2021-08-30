import { Builder } from '@contember/dic'
import {
	MigrationCreator,
	MigrationDescriber,
	MigrationFilesManager,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaVersionBuilder,
} from '@contember/schema-migrations'

export interface MigrationsContainer {
	migrationCreator: MigrationCreator
	migrationDescriber: MigrationDescriber
	schemaVersionBuilder: SchemaVersionBuilder
	schemaDiffer: SchemaDiffer
	migrationsResolver: MigrationsResolver
	migrationFilesManager: MigrationFilesManager
	schemaMigrator: SchemaMigrator
}

export class MigrationsContainerFactory {
	constructor(private readonly directory: string) {}

	public create(): MigrationsContainer {
		return new Builder({})
			.addService('migrationFilesManager', () =>
				new MigrationFilesManager(this.directory))
			.addService('modificationHandlerFactory', () =>
				new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
			.addService('schemaMigrator', ({ modificationHandlerFactory }) =>
				new SchemaMigrator(modificationHandlerFactory))
			.addService('migrationsResolver', ({ migrationFilesManager }) =>
				new MigrationsResolver(migrationFilesManager))
			.addService('schemaVersionBuilder', ({ migrationsResolver, schemaMigrator }) =>
				new SchemaVersionBuilder(migrationsResolver, schemaMigrator))
			.addService('schemaDiffer', ({ schemaMigrator }) =>
				new SchemaDiffer(schemaMigrator))
			.addService('migrationCreator', ({ migrationFilesManager, schemaDiffer }) =>
				new MigrationCreator(migrationFilesManager, schemaDiffer))
			.addService('migrationDescriber', ({ modificationHandlerFactory }) =>
				new MigrationDescriber(modificationHandlerFactory))
			.build()
			.pick(
				'migrationCreator',
				'migrationDescriber',
				'schemaVersionBuilder',
				'schemaDiffer',
				'migrationsResolver',
				'migrationFilesManager',
				'schemaMigrator',
			)
	}
}

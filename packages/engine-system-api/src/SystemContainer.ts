import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Builder, Container } from '@contember/dic'
import {
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '@contember/schema-migrations'
import {
	ContentQueryExecutor,
	EventResponseBuilder,
	ExecutedMigrationsResolver,
	IdentityFetcher,
	MigrationAlterer,
	MigrationsDatabaseMetadataResolverStoreFactory,
	PermissionsFactory,
	ProjectMigrator,
	ProjectTruncateExecutor,
} from './model'
import { UuidProvider } from './utils'
import {
	EventsQueryResolver,
	ExecutedMigrationsQueryResolver,
	MigrateMutationResolver,
	MigrationAlterMutationResolver,
	ResolverFactory,
	StagesQueryResolver,
	SystemResolverContextFactory,
	TruncateMutationResolver,
} from './resolvers'
import { EventOldValuesResolver } from './resolvers/types'
import { DatabaseMetadataResolver } from '@contember/database'
import { SchemaProvider } from './model'
import { SchemaQueryResolver } from './resolvers/query/SchemaQueryResolver'

export interface SystemContainer {
	systemResolversFactory: ResolverFactory
	authorizator: Authorizator
	resolverContextFactory: SystemResolverContextFactory
	schemaProvider: SchemaProvider
}

type Args = {
	identityFetcher: IdentityFetcher
}

export class SystemContainerFactory {
	constructor(
		private readonly providers: UuidProvider,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
		private readonly contentQueryExecutor: ContentQueryExecutor,
	) {
	}

	public create(container: Args): Container<SystemContainer> {
		return this.createBuilder(container)
			.build()
			.pick(
				'systemResolversFactory',
				'authorizator',
				'resolverContextFactory',
				'schemaProvider',
			)
	}
	public createBuilder({ identityFetcher }: Args) {
		return new Builder({})
			.addService('providers', () =>
				this.providers)
			.addService('modificationHandlerFactory', () =>
				this.modificationHandlerFactory)
			.addService('identityFetcher', () =>
				identityFetcher)
			.addService('schemaMigrator', ({ modificationHandlerFactory }) =>
				new SchemaMigrator(modificationHandlerFactory))
			.addService('executedMigrationsResolver', ({}) =>
				new ExecutedMigrationsResolver())
			.addService('schemaProvider', ({ executedMigrationsResolver, schemaMigrator }) =>
				new SchemaProvider(executedMigrationsResolver, schemaMigrator))
			.addService('accessEvaluator', ({}) =>
				new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator =>
				new Authorizator.Default(accessEvaluator))
			.addService('schemaDiffer', ({ schemaMigrator }) =>
				new SchemaDiffer(schemaMigrator))
			.addService('migrationDescriber', ({ modificationHandlerFactory }) =>
				new MigrationDescriber(modificationHandlerFactory))
			.addService('databaseMetadataResolver', () =>
				new DatabaseMetadataResolver())
			.addService('migrationsDatabaseMetadataResolverStoreFactory', ({ databaseMetadataResolver }) =>
				new MigrationsDatabaseMetadataResolverStoreFactory(databaseMetadataResolver))
			.addService('projectMigrator', ({ migrationDescriber, schemaProvider, executedMigrationsResolver, migrationsDatabaseMetadataResolverStoreFactory }) =>
				new ProjectMigrator(migrationDescriber, schemaProvider, executedMigrationsResolver, migrationsDatabaseMetadataResolverStoreFactory, this.contentQueryExecutor))
			.addService('projectTruncateExecutor', () =>
				new ProjectTruncateExecutor())
			.addService('migrationAlterer', ({ schemaProvider }) =>
				new MigrationAlterer(schemaProvider))
			.addService('eventResponseBuilder', ({ identityFetcher }) =>
				new EventResponseBuilder(identityFetcher))
			.addService('stagesQueryResolver', () =>
				new StagesQueryResolver())
			.addService('executedMigrationsQueryResolver', () =>
				new ExecutedMigrationsQueryResolver())
			.addService('migrateMutationResolver', ({ projectMigrator }) =>
				new MigrateMutationResolver(projectMigrator))
			.addService('truncateMutationResolver', ({ projectTruncateExecutor }) =>
				new TruncateMutationResolver(projectTruncateExecutor))
			.addService('migrationAlterMutationResolver', ({ migrationAlterer }) =>
				new MigrationAlterMutationResolver(migrationAlterer))
			.addService('eventsQueryResolver', ({ eventResponseBuilder }) =>
				new EventsQueryResolver(eventResponseBuilder))
			.addService('eventOldValuesResolver', () =>
				new EventOldValuesResolver())
			.addService('schemaQueryResolver', () =>
				new SchemaQueryResolver())
			.addService('systemResolversFactory', ({ stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver, eventsQueryResolver, eventOldValuesResolver, schemaQueryResolver }) =>
				new ResolverFactory(stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver, eventsQueryResolver, eventOldValuesResolver, schemaQueryResolver))
			.addService('resolverContextFactory', ({ authorizator }) =>
				new SystemResolverContextFactory(authorizator))
	}
}

import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Builder, Container } from '@contember/dic'
import {
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '@contember/schema-migrations'
import {
	EventResponseBuilder,
	ExecutedMigrationsResolver,
	IdentityFetcher,
	MigrationAlterer,
	PermissionsFactory,
	ProjectMigrator,
	ProjectTruncateExecutor,
	SchemaVersionBuilder,
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

export interface SystemContainer {
	systemResolversFactory: ResolverFactory
	authorizator: Authorizator
	resolverContextFactory: SystemResolverContextFactory
	schemaVersionBuilder: SchemaVersionBuilder
}

type Args = {
	identityFetcher: IdentityFetcher
}

export class SystemContainerFactory {
	constructor(
		private readonly providers: UuidProvider,
		private readonly modificationHandlerFactory: ModificationHandlerFactory,
	) {
	}

	public create(container: Args): Container<SystemContainer> {
		return this.createBuilder(container)
			.build()
			.pick(
				'systemResolversFactory',
				'authorizator',
				'resolverContextFactory',
				'schemaVersionBuilder',
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
			.addService('schemaVersionBuilder', ({ executedMigrationsResolver, schemaMigrator }) =>
				new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator))
			.addService('accessEvaluator', ({}) =>
				new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator =>
				new Authorizator.Default(accessEvaluator))
			.addService('schemaDiffer', ({ schemaMigrator }) =>
				new SchemaDiffer(schemaMigrator))
			.addService('migrationDescriber', ({ modificationHandlerFactory }) =>
				new MigrationDescriber(modificationHandlerFactory))
			.addService('projectMigrator', ({ migrationDescriber, schemaVersionBuilder, executedMigrationsResolver }) =>
				new ProjectMigrator(migrationDescriber, schemaVersionBuilder, executedMigrationsResolver))
			.addService('projectTruncateExecutor', () =>
				new ProjectTruncateExecutor())
			.addService('migrationAlterer', () =>
				new MigrationAlterer())
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
			.addService('systemResolversFactory', ({ stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver, eventsQueryResolver, eventOldValuesResolver }) =>
				new ResolverFactory(stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver, eventsQueryResolver, eventOldValuesResolver))
			.addService('resolverContextFactory', ({ authorizator }) =>
				new SystemResolverContextFactory(authorizator))
	}
}

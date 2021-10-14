import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Builder, Container } from '@contember/dic'
import {
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '@contember/schema-migrations'
import { MigrationsRunner } from '@contember/database-migrations'
import { DatabaseCredentials } from '@contember/database'
import {
	CreatedRowReferenceDependencyBuilder,
	DeletedRowReferenceDependencyBuilder,
	DependencyBuilderList,
	DiffBuilder,
	EntitiesSelector,
	ExecutedMigrationsResolver,
	MigrationAlterer,
	MigrationExecutor,
	PermissionsFactory,
	ProjectInitializer,
	ProjectMigrator,
	ProjectTruncateExecutor,
	SameRowDependencyBuilder,
	SchemaVersionBuilder,
	StageCreator,
	TransactionDependencyBuilder,
} from './model'
import { UuidProvider } from './utils'
import {
	ExecutedMigrationsQueryResolver,
	MigrateMutationResolver,
	ResolverContextFactory,
	ResolverFactory,
	StagesQueryResolver,
	TruncateMutationResolver,
} from './resolvers'
import { ClientBase } from 'pg'
import { MigrationAlterMutationResolver } from './resolvers/mutation/MigrationAlterMutationResolver'
import { MigrationArgs } from './migrations'

export interface SystemContainer {
	systemResolversFactory: ResolverFactory
	authorizator: Authorizator
	resolverContextFactory: ResolverContextFactory
	schemaVersionBuilder: SchemaVersionBuilder
	projectInitializer: ProjectInitializer
	systemDbMigrationsRunnerFactory: SystemDbMigrationsRunnerFactory
}

export type SystemDbMigrationsRunnerFactory = (db: DatabaseCredentials, dbClient: ClientBase) => MigrationsRunner<MigrationArgs>

type Args = {
	providers: UuidProvider
	modificationHandlerFactory: ModificationHandlerFactory
	entitiesSelector: EntitiesSelector
	systemDbMigrationsRunnerFactory: (db: DatabaseCredentials, dbClient: ClientBase) => MigrationsRunner<MigrationArgs>
}

export class SystemContainerFactory {
	public create(container: Args): Container<SystemContainer> {
		return this.createBuilder(container)
			.build()
			.pick(
				'systemResolversFactory',
				'authorizator',
				'resolverContextFactory',
				'schemaVersionBuilder',
				'projectInitializer',
				'systemDbMigrationsRunnerFactory',
			)
	}
	public createBuilder(container: Args) {
		return new Builder({})
			.addService('systemDbMigrationsRunnerFactory', () =>
				container.systemDbMigrationsRunnerFactory)
			.addService('modificationHandlerFactory', () =>
				container.modificationHandlerFactory)
			.addService('schemaMigrator', ({ modificationHandlerFactory }) =>
				new SchemaMigrator(modificationHandlerFactory))
			.addService('executedMigrationsResolver', ({}) =>
				new ExecutedMigrationsResolver())
			.addService('schemaVersionBuilder', ({ executedMigrationsResolver, schemaMigrator }) =>
				new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator))
			.addService('providers', () =>
				container.providers)
			.addService('accessEvaluator', ({}) =>
				new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator =>
				new Authorizator.Default(accessEvaluator))
			.addService('schemaDiffer', ({ schemaMigrator }) =>
				new SchemaDiffer(schemaMigrator))
			.addService('migrationExecutor', ({ modificationHandlerFactory }) =>
				new MigrationExecutor(modificationHandlerFactory))
			.addService('migrationDescriber', ({ modificationHandlerFactory }) =>
				new MigrationDescriber(modificationHandlerFactory))
			.addService('dependencyBuilder', ({}) =>
				new DependencyBuilderList([
					new SameRowDependencyBuilder(),
					new TransactionDependencyBuilder(),
					new DeletedRowReferenceDependencyBuilder(),
					new CreatedRowReferenceDependencyBuilder(),
				]))
			.addService('projectMigrator', ({ migrationDescriber, schemaVersionBuilder, executedMigrationsResolver }) =>
				new ProjectMigrator(migrationDescriber, schemaVersionBuilder, executedMigrationsResolver))
			.addService('stageCreator', () =>
				new StageCreator())
			.addService('diffBuilder', ({ dependencyBuilder, schemaVersionBuilder }) =>
				new DiffBuilder(dependencyBuilder, schemaVersionBuilder, container.entitiesSelector))
			.addService('projectTruncateExecutor', () =>
				new ProjectTruncateExecutor())
			.addService('migrationAlterer', () =>
				new MigrationAlterer())
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
			.addService('systemResolversFactory', ({ stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver }) =>
				new ResolverFactory(stagesQueryResolver, executedMigrationsQueryResolver, migrateMutationResolver, truncateMutationResolver, migrationAlterMutationResolver))
			.addService('resolverContextFactory', ({ authorizator, schemaVersionBuilder }) =>
				new ResolverContextFactory(authorizator, schemaVersionBuilder))
			.addService('projectInitializer', ({ projectMigrator, stageCreator, systemDbMigrationsRunnerFactory, schemaVersionBuilder }) =>
				new ProjectInitializer(projectMigrator, stageCreator, systemDbMigrationsRunnerFactory, schemaVersionBuilder),
			)
	}
}

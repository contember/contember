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
	ContentPermissionVerifier,
	CreatedRowReferenceDependencyBuilder,
	DeletedRowReferenceDependencyBuilder,
	DependencyBuilderList,
	DiffBuilder,
	DiffResponseBuilder,
	EventApplier,
	EventsPermissionsVerifier,
	EventsRebaser,
	ExecutedMigrationsResolver,
	MigrationExecutor,
	MigrationsResolverFactory,
	PermissionsFactory,
	ProjectInitializer,
	ProjectMigrationInfoResolver,
	ProjectMigrator,
	RebaseExecutor,
	ReleaseExecutor,
	SameRowDependencyBuilder,
	SchemaVersionBuilder,
	StageCreator,
	TableReferencingResolver,
	TransactionDependencyBuilder,
} from './model'
import { Resolvers } from './schema'
import { UuidProvider } from './utils'
import {
	DiffQueryResolver,
	MigrateMutationResolver,
	RebaseAllMutationResolver,
	ReleaseMutationResolver,
	ResolverContextFactory,
	ResolverFactory,
	StagesQueryResolver,
} from './resolvers'
import { systemMigrationsDirectory } from './MigrationsDirectory'

export interface SystemContainer {
	systemResolvers: Resolvers
	authorizator: Authorizator
	resolverContextFactory: ResolverContextFactory
	schemaVersionBuilder: SchemaVersionBuilder
	projectInitializer: ProjectInitializer
	systemDbMigrationsRunnerFactory: SystemDbMigrationsRunnerFactory
}

export type SystemDbMigrationsRunnerFactory = (db: DatabaseCredentials) => MigrationsRunner

type Args = {
	providers: UuidProvider
	contentPermissionsVerifier: ContentPermissionVerifier
	modificationHandlerFactory: ModificationHandlerFactory
	migrationsResolverFactory: MigrationsResolverFactory | undefined
}

export class SystemContainerFactory {
	public create(container: Args): Container<SystemContainer> {
		return this.createBuilder(container)
			.build()
			.pick(
				'systemResolvers',
				'authorizator',
				'resolverContextFactory',
				'schemaVersionBuilder',
				'projectInitializer',
				'systemDbMigrationsRunnerFactory',
			)
	}
	public createBuilder(container: Args) {
		return new Builder({})
			.addService('systemDbMigrationsRunnerFactory', () => (db: DatabaseCredentials) =>
				new MigrationsRunner(db, 'system', systemMigrationsDirectory),
			)

			.addService('modificationHandlerFactory', () => container.modificationHandlerFactory)

			.addService('schemaMigrator', ({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory))
			.addService('executedMigrationsResolver', ({}) => new ExecutedMigrationsResolver())
			.addService(
				'schemaVersionBuilder',
				({ executedMigrationsResolver, schemaMigrator }) =>
					new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator),
			)
			.addService('providers', () => container.providers)
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator => new Authorizator.Default(accessEvaluator))

			.addService('schemaDiffer', ({ schemaMigrator }) => new SchemaDiffer(schemaMigrator))

			.addService(
				'migrationExecutor',
				({ modificationHandlerFactory }) => new MigrationExecutor(modificationHandlerFactory),
			)
			.addService(
				'migrationDescriber',
				({ modificationHandlerFactory }) => new MigrationDescriber(modificationHandlerFactory),
			)

			.addService('tableReferencingResolver', () => new TableReferencingResolver())
			.addService(
				'dependencyBuilder',
				({ tableReferencingResolver }) =>
					new DependencyBuilderList([
						new SameRowDependencyBuilder(),
						new TransactionDependencyBuilder(),
						new DeletedRowReferenceDependencyBuilder(tableReferencingResolver),
						new CreatedRowReferenceDependencyBuilder(tableReferencingResolver),
					]),
			)
			.addService(
				'permissionVerifier',
				({ schemaVersionBuilder, authorizator }) =>
					new EventsPermissionsVerifier(schemaVersionBuilder, authorizator, container.contentPermissionsVerifier),
			)
			.addService(
				'eventApplier',
				({ migrationExecutor, executedMigrationsResolver }) =>
					new EventApplier(migrationExecutor, executedMigrationsResolver),
			)
			.addService('eventsRebaser', () => new EventsRebaser())
			.addService(
				'rebaseExecutor',
				({ dependencyBuilder, eventApplier, eventsRebaser, schemaVersionBuilder }) =>
					new RebaseExecutor(dependencyBuilder, eventApplier, eventsRebaser, schemaVersionBuilder),
			)
			.addService(
				'projectMigrator',
				({ migrationDescriber, rebaseExecutor, schemaVersionBuilder, executedMigrationsResolver }) =>
					new ProjectMigrator(migrationDescriber, rebaseExecutor, schemaVersionBuilder, executedMigrationsResolver),
			)

			.addService('projectMigrationInfoResolver', ({ executedMigrationsResolver }) =>
				container.migrationsResolverFactory
					? new ProjectMigrationInfoResolver(executedMigrationsResolver, container.migrationsResolverFactory)
					: undefined,
			)
			.addService('stageCreator', ({ eventApplier }) => new StageCreator(eventApplier))

			.addService(
				'diffBuilder',
				({ dependencyBuilder, permissionVerifier, schemaVersionBuilder }) =>
					new DiffBuilder(dependencyBuilder, permissionVerifier, schemaVersionBuilder),
			)

			.addService(
				'releaseExecutor',
				({ dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, schemaVersionBuilder }) =>
					new ReleaseExecutor(dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, schemaVersionBuilder),
			)

			.addService('systemStagesQueryResolver', () => new StagesQueryResolver())

			.addService('systemDiffResponseBuilder', () => new DiffResponseBuilder())
			.addService(
				'systemDiffQueryResolver',
				({ systemDiffResponseBuilder, diffBuilder }) => new DiffQueryResolver(systemDiffResponseBuilder, diffBuilder),
			)
			.addService(
				'releaseMutationResolver',
				({ rebaseExecutor, releaseExecutor }) => new ReleaseMutationResolver(rebaseExecutor, releaseExecutor),
			)
			.addService('rebaseMutationResolver', ({ rebaseExecutor }) => new RebaseAllMutationResolver(rebaseExecutor))
			.addService('migrateMutationResolver', ({ projectMigrator }) => new MigrateMutationResolver(projectMigrator))
			.addService(
				'systemResolvers',
				({
					systemStagesQueryResolver,
					systemDiffQueryResolver,
					releaseMutationResolver,
					rebaseMutationResolver,
					migrateMutationResolver,
				}) =>
					new ResolverFactory(
						systemStagesQueryResolver,
						systemDiffQueryResolver,
						releaseMutationResolver,
						rebaseMutationResolver,
						migrateMutationResolver,
					).create(),
			)
			.addService('resolverContextFactory', ({ authorizator }) => new ResolverContextFactory(authorizator))
			.addService(
				'projectInitializer',
				({ projectMigrator, projectMigrationInfoResolver, stageCreator, systemDbMigrationsRunnerFactory }) =>
					new ProjectInitializer(
						projectMigrator,
						projectMigrationInfoResolver,
						stageCreator,
						systemDbMigrationsRunnerFactory,
					),
			)
	}
}

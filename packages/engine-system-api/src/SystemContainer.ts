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
	ContentEventsApplier,
	CreatedRowReferenceDependencyBuilder,
	DeletedRowReferenceDependencyBuilder,
	DependencyBuilderList,
	DiffBuilder,
	DiffEventResponseBuilder,
	EntitiesSelector,
	EventApplier,
	EventsRebaser,
	ExecutedMigrationsResolver,
	HistoryEventResponseBuilder,
	MigrationAlterer,
	MigrationExecutor,
	MigrationsResolverFactory,
	PermissionsFactory,
	ProjectInitializer,
	ProjectMigrationInfoResolver,
	ProjectMigrator,
	ProjectTruncateExecutor,
	RebaseExecutor,
	ReleaseExecutor,
	SameRowDependencyBuilder,
	SchemaVersionBuilder,
	StageCreator,
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
import { systemMigrationsDirectory } from './migrations'
import { ClientBase } from 'pg'
import { ReleaseTreeMutationResolver, TruncateMutationResolver } from './resolvers/mutation'
import { IdentityFetcher } from './model/dependencies/tenant/IdentityFetcher'
import { ExecutedMigrationsQueryResolver, HistoryQueryResolver } from './resolvers/query'
import { DiffEventTypeResolver, HistoryEventTypeResolver } from './resolvers/types'
import { MigrationAlterMutationResolver } from './resolvers/mutation/MigrationAlterMutationResolver'

export interface SystemContainer {
	systemResolversFactory: ResolverFactory
	authorizator: Authorizator
	resolverContextFactory: ResolverContextFactory
	schemaVersionBuilder: SchemaVersionBuilder
	projectInitializer: ProjectInitializer
	systemDbMigrationsRunnerFactory: SystemDbMigrationsRunnerFactory
}

export type SystemDbMigrationsRunnerFactory = (db: DatabaseCredentials, dbClient: ClientBase) => MigrationsRunner

type Args = {
	providers: UuidProvider
	modificationHandlerFactory: ModificationHandlerFactory
	migrationsResolverFactory: MigrationsResolverFactory | undefined
	entitiesSelector: EntitiesSelector
	eventApplier: ContentEventsApplier
	identityFetcher: IdentityFetcher
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
			.addService('systemDbMigrationsRunnerFactory', () => (db: DatabaseCredentials, dbClient: ClientBase) =>
				new MigrationsRunner(db, 'system', systemMigrationsDirectory, dbClient),
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

			.addService(
				'dependencyBuilder',
				({}) =>
					new DependencyBuilderList([
						new SameRowDependencyBuilder(),
						new TransactionDependencyBuilder(),
						new DeletedRowReferenceDependencyBuilder(),
						new CreatedRowReferenceDependencyBuilder(),
					]),
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
				({ dependencyBuilder, schemaVersionBuilder }) =>
					new DiffBuilder(dependencyBuilder, schemaVersionBuilder, container.entitiesSelector),
			)

			.addService(
				'releaseExecutor',
				({ dependencyBuilder, eventsRebaser, schemaVersionBuilder }) =>
					new ReleaseExecutor(dependencyBuilder, container.eventApplier, eventsRebaser, schemaVersionBuilder),
			)
			.addService(
				'projectTruncateExecutor',
				({ executedMigrationsResolver }) => new ProjectTruncateExecutor(executedMigrationsResolver),
			)
			.addService('migrationAlterer', () => new MigrationAlterer())

			.addService('stagesQueryResolver', () => new StagesQueryResolver())
			.addService('executedMigrationsQueryResolver', () => new ExecutedMigrationsQueryResolver())

			.addService('diffEventResponseBuilder', () => new DiffEventResponseBuilder(container.identityFetcher))
			.addService(
				'diffQueryResolver',
				({ diffEventResponseBuilder, diffBuilder }) => new DiffQueryResolver(diffEventResponseBuilder, diffBuilder),
			)
			.addService('historyEventResponseBuilder', () => new HistoryEventResponseBuilder(container.identityFetcher))
			.addService(
				'historyQueryResolver',
				({ historyEventResponseBuilder, schemaVersionBuilder }) =>
					new HistoryQueryResolver(historyEventResponseBuilder, schemaVersionBuilder),
			)
			.addService(
				'releaseMutationResolver',
				({ rebaseExecutor, releaseExecutor }) => new ReleaseMutationResolver(rebaseExecutor, releaseExecutor),
			)
			.addService(
				'releaseTreeMutationResolver',
				({ rebaseExecutor, releaseExecutor, diffBuilder }) =>
					new ReleaseTreeMutationResolver(rebaseExecutor, releaseExecutor, diffBuilder),
			)
			.addService('rebaseMutationResolver', ({ rebaseExecutor }) => new RebaseAllMutationResolver(rebaseExecutor))
			.addService('migrateMutationResolver', ({ projectMigrator }) => new MigrateMutationResolver(projectMigrator))
			.addService(
				'truncateMutationResolver',
				({ projectTruncateExecutor }) => new TruncateMutationResolver(projectTruncateExecutor),
			)
			.addService('historyEventTypeResolver', () => new HistoryEventTypeResolver())
			.addService('diffEventTypeResolver', () => new DiffEventTypeResolver())
			.addService(
				'migrationAlterMutationResolver',
				({ migrationAlterer }) => new MigrationAlterMutationResolver(migrationAlterer),
			)
			.addService(
				'systemResolversFactory',
				({
					stagesQueryResolver,
					executedMigrationsQueryResolver,
					diffQueryResolver,
					historyQueryResolver,
					releaseMutationResolver,
					rebaseMutationResolver,
					migrateMutationResolver,
					releaseTreeMutationResolver,
					truncateMutationResolver,
					historyEventTypeResolver,
					diffEventTypeResolver,
					migrationAlterMutationResolver,
				}) =>
					new ResolverFactory(
						stagesQueryResolver,
						executedMigrationsQueryResolver,
						diffQueryResolver,
						historyQueryResolver,
						releaseMutationResolver,
						rebaseMutationResolver,
						migrateMutationResolver,
						releaseTreeMutationResolver,
						truncateMutationResolver,
						historyEventTypeResolver,
						diffEventTypeResolver,
						migrationAlterMutationResolver,
					),
			)
			.addService(
				'resolverContextFactory',
				({ authorizator, schemaVersionBuilder }) => new ResolverContextFactory(authorizator, schemaVersionBuilder),
			)
			.addService(
				'projectInitializer',
				({
					projectMigrator,
					projectMigrationInfoResolver,
					stageCreator,
					systemDbMigrationsRunnerFactory,
					schemaVersionBuilder,
				}) =>
					new ProjectInitializer(
						projectMigrator,
						projectMigrationInfoResolver,
						stageCreator,
						systemDbMigrationsRunnerFactory,
						schemaVersionBuilder,
					),
			)
	}
}

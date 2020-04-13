import { Providers, ResolverContextFactory, SchemaVersionBuilder } from './index'
import { ExecutedMigrationsResolver } from './model/migrations/ExecutedMigrationsResolver'
import PermissionsFactory from './model/authorization/PermissionsFactory'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import DependencyBuilder from './model/events/DependencyBuilder'
import SameRowDependencyBuilder from './model/events/dependency/SameRowDependencyBuilder'
import TransactionDependencyBuilder from './model/events/dependency/TransactionDependencyBuilder'
import DeletedRowReferenceDependencyBuilder from './model/events/dependency/DeletedRowReferenceDependencyBuilder'
import CreatedRowReferenceDependencyBuilder from './model/events/dependency/CreatedRowReferenceDependencyBuilder'
import { ContentPermissionVerifier, EventsPermissionsVerifier } from './model/events/EventsPermissionsVerifier'
import DiffBuilder from './model/events/DiffBuilder'
import EventApplier from './model/events/EventApplier'
import EventsRebaser from './model/events/EventsRebaser'
import RebaseExecutor from './model/events/RebaseExecutor'
import ReleaseExecutor from './model/events/ReleaseExecutor'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import StageCreator from './model/stages/StageCreator'
import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import RebaseAllMutationResolver from './resolvers/mutation/RebaseAllMutationResolver'
import { MigrateMutationResolver } from './resolvers/mutation/MigrateMutationResolver'
import ResolverFactory from './resolvers/ResolverFactory'
import { MigrationDescriber, ModificationHandlerFactory, SchemaMigrator } from '@contember/schema-migrations'
import { Builder } from '@contember/dic'
import { AccessEvaluator, Authorizator } from '@contember/authorization'

export class SystemServerContainerFactory {
	constructor(
		private readonly container: {
			modificationHandlerFactory: ModificationHandlerFactory
			contentPermissionVerifier: ContentPermissionVerifier
			providers: Providers
		},
	) {}

	public create() {
		return new Builder({})
			.addService('modificationHandlerFactory', () => this.container.modificationHandlerFactory)

			.addService('schemaMigrator', ({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory))
			.addService('executedMigrationsResolver', ({}) => new ExecutedMigrationsResolver())
			.addService(
				'schemaVersionBuilder',
				({ executedMigrationsResolver, schemaMigrator }) =>
					new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator),
			)
			.addService('providers', () => this.container.providers)
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator => new Authorizator.Default(accessEvaluator))

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
					new DependencyBuilder.DependencyBuilderList([
						new SameRowDependencyBuilder(),
						new TransactionDependencyBuilder(),
						new DeletedRowReferenceDependencyBuilder(tableReferencingResolver),
						new CreatedRowReferenceDependencyBuilder(tableReferencingResolver),
					]),
			)
			.addService(
				'permissionVerifier',
				({ schemaVersionBuilder, authorizator }) =>
					new EventsPermissionsVerifier(schemaVersionBuilder, authorizator, this.container.contentPermissionVerifier),
			)
			.addService(
				'diffBuilder',
				({ dependencyBuilder, permissionVerifier, schemaVersionBuilder }) =>
					new DiffBuilder(dependencyBuilder, permissionVerifier, schemaVersionBuilder),
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
				'releaseExecutor',
				({ dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, schemaVersionBuilder }) =>
					new ReleaseExecutor(dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, schemaVersionBuilder),
			)
			.addService(
				'projectMigrator',
				({ migrationDescriber, rebaseExecutor, schemaVersionBuilder, executedMigrationsResolver }) =>
					new ProjectMigrator(migrationDescriber, rebaseExecutor, schemaVersionBuilder, executedMigrationsResolver),
			)
			.addService('stageCreator', ({ eventApplier }) => new StageCreator(eventApplier))
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
	}
}

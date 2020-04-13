import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { Builder, Container } from '@contember/dic'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import {
	MigrationDescriber,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
} from '@contember/schema-migrations'
import { Resolvers } from './schema'
import PermissionsFactory from './model/authorization/PermissionsFactory'
import { ContentPermissionVerifier, EventsPermissionsVerifier } from './model/events/EventsPermissionsVerifier'
import { UuidProvider } from './utils/uuid'
import { ExecutedMigrationsResolver } from './model/migrations/ExecutedMigrationsResolver'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import DependencyBuilder from './model/events/DependencyBuilder'
import SameRowDependencyBuilder from './model/events/dependency/SameRowDependencyBuilder'
import TransactionDependencyBuilder from './model/events/dependency/TransactionDependencyBuilder'
import DeletedRowReferenceDependencyBuilder from './model/events/dependency/DeletedRowReferenceDependencyBuilder'
import CreatedRowReferenceDependencyBuilder from './model/events/dependency/CreatedRowReferenceDependencyBuilder'
import EventApplier from './model/events/EventApplier'
import EventsRebaser from './model/events/EventsRebaser'
import RebaseExecutor from './model/events/RebaseExecutor'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import { ProjectInitializer } from './ProjectInitializer'
import { DatabaseCredentials } from '@contember/database'
import { ResolverContextFactory } from './resolvers'
import { MigrationsRunner } from '@contember/database-migrations'
import { systemMigrationsDirectory } from './index'
import DiffBuilder from './model/events/DiffBuilder'
import ReleaseExecutor from './model/events/ReleaseExecutor'
import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import RebaseAllMutationResolver from './resolvers/mutation/RebaseAllMutationResolver'
import { MigrateMutationResolver } from './resolvers/mutation/MigrateMutationResolver'
import ResolverFactory from './resolvers/ResolverFactory'

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
	projectsDir: string | undefined
	providers: UuidProvider
	contentPermissionsVerifier: ContentPermissionVerifier
	modificationHandlerFactory: ModificationHandlerFactory
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
				container.projectsDir
					? new ProjectMigrationInfoResolver(executedMigrationsResolver, container.projectsDir)
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
				({ projectMigrator, projectMigrationInfoResolver, stageCreator }) =>
					new ProjectInitializer(projectMigrator, projectMigrationInfoResolver, stageCreator),
			)
	}
}

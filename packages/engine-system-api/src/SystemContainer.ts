import { AccessEvaluator, Authorizator } from '@contember/authorization'
import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import { Builder, Container } from '@contember/dic'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import ResolverFactory from './resolvers/ResolverFactory'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import {
	MigrationFilesManager,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaDiffer,
	SchemaMigrator,
	SchemaVersionBuilder as MigrationsSchemaVersionBuiler,
} from '@contember/schema-migrations'
import { ProjectConfig } from './types'
import RebeaseAllMutationResolver from './resolvers/mutation/RebeaseAllMutationResolver'
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
import DiffBuilder from './model/events/DiffBuilder'
import EventApplier from './model/events/EventApplier'
import EventsRebaser from './model/events/EventsRebaser'
import StageTree from './model/stages/StageTree'
import RebaseExecutor from './model/events/RebaseExecutor'
import ReleaseExecutor from './model/events/ReleaseExecutor'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import { ProjectInitializer } from './ProjectInitializer'
import { Connection, DatabaseCredentials } from '@contember/database'
import { ResolverContextFactory } from './resolvers'
import { MigrationsRunner } from '@contember/database-migrations'
import { DatabaseContextFactory, systemMigrationsDirectory } from './index'

export interface SystemContainer {
	systemResolvers: Resolvers
	authorizator: Authorizator
	resolverContextFactory: ResolverContextFactory
	schemaVersionBuilder: SchemaVersionBuilder
	systemDatabaseContextFactory: DatabaseContextFactory
	projectInitializer: ProjectInitializer
	systemDbMigrationsRunner: MigrationsRunner
}

type Args = {
	connection: Connection
	projectsDir: string
	providers: UuidProvider
	project: ProjectConfig & { directory?: string }
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
				'systemDatabaseContextFactory',
				'projectInitializer',
				'systemDbMigrationsRunner',
			)
	}
	public createBuilder(container: Args) {
		return new Builder({})
			.addService(
				'systemDbMigrationsRunner',
				() =>
					new MigrationsRunner(container.connection.config as DatabaseCredentials, 'system', systemMigrationsDirectory),
			)

			.addService('modificationHandlerFactory', () => container.modificationHandlerFactory)

			.addService('schemaMigrator', ({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory))
			.addService('executedMigrationsResolver', ({}) => new ExecutedMigrationsResolver())
			.addService(
				'schemaVersionBuilder',
				({ executedMigrationsResolver, schemaMigrator }) =>
					new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator),
			)
			.addService('project', () => container.project)
			.addService('providers', () => container.providers)
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator => new Authorizator.Default(accessEvaluator))

			.addService('migrationFilesManager', ({ project }) =>
				MigrationFilesManager.createForProject(container.projectsDir, project.directory || project.slug),
			)
			.addService('migrationsResolver', ({ migrationFilesManager }) => new MigrationsResolver(migrationFilesManager))

			.addService('schemaDiffer', ({ schemaMigrator }) => new SchemaDiffer(schemaMigrator))
			.addService(
				'schemaVersionBuilderInternal',
				({ schemaMigrator, migrationsResolver }) =>
					new MigrationsSchemaVersionBuiler(migrationsResolver, schemaMigrator),
			)
			.addService(
				'migrationExecutor',
				({ modificationHandlerFactory }) => new MigrationExecutor(modificationHandlerFactory),
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
				({ schemaVersionBuilder, authorizator, project }) =>
					new EventsPermissionsVerifier(
						project,
						schemaVersionBuilder,
						authorizator,
						container.contentPermissionsVerifier,
					),
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
			.addService('stageTree', ({ project }) => new StageTree.Factory().create(project))
			.addService(
				'rebaseExecutor',
				({ dependencyBuilder, eventApplier, eventsRebaser, stageTree, schemaVersionBuilder }) =>
					new RebaseExecutor(dependencyBuilder, eventApplier, eventsRebaser, stageTree, schemaVersionBuilder),
			)
			.addService(
				'releaseExecutor',
				({ dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, stageTree, schemaVersionBuilder }) =>
					new ReleaseExecutor(
						dependencyBuilder,
						permissionVerifier,
						eventApplier,
						eventsRebaser,
						stageTree,
						schemaVersionBuilder,
					),
			)
			.addService(
				'projectMigrator',
				({ stageTree, modificationHandlerFactory, rebaseExecutor, schemaVersionBuilder }) =>
					new ProjectMigrator(stageTree, modificationHandlerFactory, rebaseExecutor, schemaVersionBuilder),
			)

			.addService(
				'projectMigrationInfoResolver',
				({ migrationsResolver, project, executedMigrationsResolver }) =>
					new ProjectMigrationInfoResolver(project, migrationsResolver, executedMigrationsResolver),
			)
			.addService('stageCreator', ({ eventApplier, providers }) => new StageCreator(eventApplier))
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
			.addService(
				'rebaseMutationResolver',
				({ rebaseExecutor, project }) => new RebeaseAllMutationResolver(rebaseExecutor, project),
			)
			.addService(
				'systemResolvers',
				({ systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver, rebaseMutationResolver }) =>
					new ResolverFactory(
						systemStagesQueryResolver,
						systemDiffQueryResolver,
						releaseMutationResolver,
						rebaseMutationResolver,
					).create(),
			)
			.addService('connection', () => container.connection)
			.addService('systemDbClient', ({ connection }) => connection.createClient('system'))
			.addService(
				'systemDatabaseContextFactory',
				({ systemDbClient, providers }) => new DatabaseContextFactory(systemDbClient, providers),
			)
			.addService(
				'resolverContextFactory',
				({ systemDatabaseContextFactory, authorizator }) =>
					new ResolverContextFactory(systemDatabaseContextFactory, authorizator),
			)
			.addService(
				'projectInitializer',
				({ systemDatabaseContextFactory, stageTree, projectMigrator, projectMigrationInfoResolver, stageCreator }) =>
					new ProjectInitializer(
						systemDatabaseContextFactory,
						stageTree,
						projectMigrator,
						projectMigrationInfoResolver,
						stageCreator,
					),
			)
	}
}

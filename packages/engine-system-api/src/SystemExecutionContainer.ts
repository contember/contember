import { Authorizator } from '@contember/authorization'
import {
	MigrationFilesManager,
	MigrationsResolver,
	ModificationHandlerFactory,
	SchemaMigrator,
	SchemaVersionBuilder as SchemaVersionBuilderInternal,
} from '@contember/schema-migrations'
import SameRowDependencyBuilder from './model/events/dependency/SameRowDependencyBuilder'
import TransactionDependencyBuilder from './model/events/dependency/TransactionDependencyBuilder'
import DeletedRowReferenceDependencyBuilder from './model/events/dependency/DeletedRowReferenceDependencyBuilder'
import CreatedRowReferenceDependencyBuilder from './model/events/dependency/CreatedRowReferenceDependencyBuilder'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import EventApplier from './model/events/EventApplier'
import EventsRebaser from './model/events/EventsRebaser'
import ReleaseExecutor from './model/events/ReleaseExecutor'
import { Builder } from '@contember/dic'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import { Client, DatabaseQueryable } from '@contember/database'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { ContentPermissionVerifier, EventsPermissionsVerifier } from './model/events/EventsPermissionsVerifier'
import DependencyBuilder from './model/events/DependencyBuilder'
import DiffBuilder from './model/events/DiffBuilder'
import { QueryHandler } from '@contember/queryable'
import { ProjectConfig } from './types'
import RebaseExecutor from './model/events/RebaseExecutor'
import StageTree from './model/stages/StageTree'
import ProjectInitializer from './ProjectInitializer'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import StageCreator from './model/stages/StageCreator'
import { UuidProvider } from './utils/uuid'
import { ExecutedMigrationsResolver } from './model/migrations/ExecutedMigrationsResolver'

interface SystemExecutionContainer {
	releaseExecutor: ReleaseExecutor
	rebaseExecutor: RebaseExecutor
	diffBuilder: DiffBuilder
	queryHandler: QueryHandler<DatabaseQueryable>
	projectIntializer: ProjectInitializer
	project: ProjectConfig
}

namespace SystemExecutionContainer {
	export class Factory {
		constructor(
			private readonly projectsDir: string,
			private readonly project: ProjectConfig & { directory?: string },
			private readonly authorizator: Authorizator,
			private readonly modificationHandlerFactory: ModificationHandlerFactory,
			private readonly contentPermissionsVerifier: ContentPermissionVerifier,
			private readonly providers: UuidProvider,
		) {}

		public create(db: Client): SystemExecutionContainer {
			return this.createBuilder(db)
				.build()
				.pick('project', 'queryHandler', 'releaseExecutor', 'diffBuilder', 'rebaseExecutor', 'projectIntializer')
		}

		public createBuilder(db: Client) {
			return new Builder({})
				.addService('project', () => this.project)
				.addService('providers', () => this.providers)
				.addService('migrationFilesManager', ({ project }) =>
					MigrationFilesManager.createForProject(this.projectsDir, project.directory || project.slug),
				)
				.addService('migrationsResolver', ({ migrationFilesManager }) => new MigrationsResolver(migrationFilesManager))
				.addService('modificationHandlerFactory', () => this.modificationHandlerFactory)
				.addService('authorizator', () => this.authorizator)

				.addService('db', () => db)
				.addService('queryHandler', ({ db }) => db.createQueryHandler())
				.addService('executedMigrationsResolver', ({ queryHandler }) => new ExecutedMigrationsResolver(queryHandler))
				.addService(
					'schemaMigrator',
					({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory),
				)
				.addService(
					'schemaVersionBuilderInternal',
					({ schemaMigrator, migrationsResolver }) =>
						new SchemaVersionBuilderInternal(migrationsResolver, schemaMigrator),
				)
				.addService(
					'schemaVersionBuilder',
					({ executedMigrationsResolver, schemaMigrator }) =>
						new SchemaVersionBuilder(executedMigrationsResolver, schemaMigrator),
				)
				.addService(
					'migrationExecutor',
					({ schemaVersionBuilder, modificationHandlerFactory, providers }) =>
						new MigrationExecutor(modificationHandlerFactory, schemaVersionBuilder, providers),
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
					({ schemaVersionBuilder, db, authorizator, project }) =>
						new EventsPermissionsVerifier(
							project,
							schemaVersionBuilder,
							db,
							authorizator,
							this.contentPermissionsVerifier,
						),
				)
				.addService(
					'diffBuilder',
					({ dependencyBuilder, queryHandler, permissionVerifier, schemaVersionBuilder }) =>
						new DiffBuilder(dependencyBuilder, queryHandler, permissionVerifier, schemaVersionBuilder),
				)
				.addService(
					'eventApplier',
					({ db, migrationExecutor, executedMigrationsResolver }) =>
						new EventApplier(db, migrationExecutor, executedMigrationsResolver),
				)
				.addService('eventsRebaser', ({ db }) => new EventsRebaser(db))
				.addService('stageTree', ({ project }) => new StageTree.Factory().create(project))
				.addService(
					'rebaseExecutor',
					({ queryHandler, dependencyBuilder, eventApplier, eventsRebaser, stageTree, schemaVersionBuilder }) =>
						new RebaseExecutor(
							queryHandler,
							dependencyBuilder,
							eventApplier,
							eventsRebaser,
							stageTree,
							schemaVersionBuilder,
						),
				)
				.addService(
					'releaseExecutor',
					({
						queryHandler,
						dependencyBuilder,
						permissionVerifier,
						eventApplier,
						eventsRebaser,
						stageTree,
						db,
						schemaVersionBuilder,
					}) =>
						new ReleaseExecutor(
							queryHandler,
							dependencyBuilder,
							permissionVerifier,
							eventApplier,
							eventsRebaser,
							stageTree,
							db,
							schemaVersionBuilder,
						),
				)
				.addService(
					'projectMigrationInfoResolver',
					({ migrationsResolver, project, executedMigrationsResolver }) =>
						new ProjectMigrationInfoResolver(project, migrationsResolver, executedMigrationsResolver),
				)
				.addService(
					'projectMigrator',
					({ db, stageTree, modificationHandlerFactory, providers }) =>
						new ProjectMigrator(db, stageTree, modificationHandlerFactory, providers),
				)
				.addService('stageCreator', ({ db, eventApplier, providers }) => new StageCreator(db, eventApplier, providers))
				.addService(
					'projectIntializer',
					({
						db,
						stageTree,
						projectMigrator,
						rebaseExecutor,
						projectMigrationInfoResolver,
						stageCreator,
						providers,
						schemaVersionBuilder,
					}) =>
						new ProjectInitializer(
							db,
							stageTree,
							projectMigrator,
							rebaseExecutor,
							projectMigrationInfoResolver,
							stageCreator,
							providers,
							schemaVersionBuilder,
						),
				)
		}
	}
}

export { SystemExecutionContainer }

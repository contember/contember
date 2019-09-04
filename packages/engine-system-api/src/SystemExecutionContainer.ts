import { Authorizator } from '@contember/authorization'
import MigrationsDependencyBuilder from './model/events/dependency/MigrationsDependencyBuilder'
import SameRowDependencyBuilder from './model/events/dependency/SameRowDependencyBuilder'
import TransactionDependencyBuilder from './model/events/dependency/TransactionDependencyBuilder'
import DeletedRowReferenceDependencyBuilder from './model/events/dependency/DeletedRowReferenceDependencyBuilder'
import CreatedRowReferenceDependencyBuilder from './model/events/dependency/CreatedRowReferenceDependencyBuilder'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import EventApplier from './model/events/EventApplier'
import EventsRebaser from './model/events/EventsRebaser'
import ReleaseExecutor from './model/events/ReleaseExecutor'
import { Builder, Container } from '@contember/dic'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import { Client } from '@contember/database'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { MigrationFilesManager } from '@contember/engine-common'
import { ContentPermissionVerifier, EventsPermissionsVerifier } from './model/events/EventsPermissionsVerifier'
import DependencyBuilder from './model/events/DependencyBuilder'
import DiffBuilder from './model/events/DiffBuilder'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { ProjectConfig } from './types'
import { SchemaMigrator } from './SchemaMigrator'
import { MigrationsResolver } from './MigrationsResolver'
import RebaseExecutor from './model/events/RebaseExecutor'
import StageTree from './model/stages/StageTree'
import ModificationHandlerFactory from './model/migrations/modifications/ModificationHandlerFactory'
import MigrationDiffCreator from './model/migrations/MigrationDiffCreator'
import ProjectInitializer from './ProjectInitializer'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import SchemaDiffer from './model/migrations/SchemaDiffer'
import StageCreator from './model/stages/StageCreator'
import MigrationSqlDryRunner from './model/migrations/MigrationSqlDryRunner'
import { UuidProvider } from './utils/uuid'

interface SystemExecutionContainer {
	releaseExecutor: ReleaseExecutor
	rebaseExecutor: RebaseExecutor
	diffBuilder: DiffBuilder
	migrationDiffCreator: MigrationDiffCreator
	queryHandler: QueryHandler<DatabaseQueryable>
	projectIntializer: ProjectInitializer
	migrationSqlDryRunner: MigrationSqlDryRunner
}

namespace SystemExecutionContainer {
	export class Factory {
		constructor(
			private readonly project: ProjectConfig,
			private readonly migrationsResolver: MigrationsResolver,
			private readonly migrationFilesManager: MigrationFilesManager,
			private readonly authorizator: Authorizator,
			private readonly modificationHandlerFactory: ModificationHandlerFactory,
			private readonly contentPermissionsVerifier: ContentPermissionVerifier,
			private readonly providers: UuidProvider,
		) {}

		public create(db: Client): SystemExecutionContainer {
			return this.createBuilder(db)
				.build()
				.pick(
					'queryHandler',
					'releaseExecutor',
					'diffBuilder',
					'rebaseExecutor',
					'migrationDiffCreator',
					'projectIntializer',
					'migrationSqlDryRunner',
				)
		}

		public createBuilder(db: Client) {
			return new Builder({})
				.addService('providers', () => this.providers)
				.addService('migrationFilesManager', ({}) => this.migrationFilesManager)
				.addService('migrationsResolver', () => this.migrationsResolver)
				.addService('modificationHandlerFactory', () => this.modificationHandlerFactory)
				.addService('authorizator', () => this.authorizator)

				.addService('db', () => db)
				.addService('queryHandler', ({ db }) => db.createQueryHandler())
				.addService(
					'schemaMigrator',
					({ modificationHandlerFactory }) => new SchemaMigrator(modificationHandlerFactory),
				)
				.addService('schemaDiffer', ({ schemaMigrator }) => new SchemaDiffer(schemaMigrator))
				.addService(
					'schemaVersionBuilder',
					({ queryHandler, schemaMigrator, migrationsResolver }) =>
						new SchemaVersionBuilder(queryHandler, migrationsResolver, schemaMigrator),
				)
				.addService(
					'migrationExecutor',
					({ schemaVersionBuilder, modificationHandlerFactory, providers }) =>
						new MigrationExecutor(modificationHandlerFactory, schemaVersionBuilder, providers),
				)

				.addService('tableReferencingResolver', () => new TableReferencingResolver())
				.addService(
					'dependencyBuilder',
					({ schemaVersionBuilder, tableReferencingResolver }) =>
						new DependencyBuilder.DependencyBuilderList([
							new MigrationsDependencyBuilder(),
							new SameRowDependencyBuilder(),
							new TransactionDependencyBuilder(),
							new DeletedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
							new CreatedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
						]),
				)
				.addService(
					'permissionVerifier',
					({ schemaVersionBuilder, db, authorizator }) =>
						new EventsPermissionsVerifier(
							this.project,
							schemaVersionBuilder,
							db,
							authorizator,
							this.contentPermissionsVerifier,
						),
				)
				.addService(
					'diffBuilder',
					({ dependencyBuilder, queryHandler, permissionVerifier }) =>
						new DiffBuilder(dependencyBuilder, queryHandler, permissionVerifier),
				)
				.addService(
					'eventApplier',
					({ db, migrationExecutor, migrationsResolver }) =>
						new EventApplier(db, migrationExecutor, migrationsResolver),
				)
				.addService('eventsRebaser', ({ db }) => new EventsRebaser(db))
				.addService('stageTree', () => new StageTree.Factory().create(this.project))
				.addService(
					'rebaseExecutor',
					({ queryHandler, dependencyBuilder, eventApplier, eventsRebaser, stageTree }) =>
						new RebaseExecutor(queryHandler, dependencyBuilder, eventApplier, eventsRebaser, stageTree),
				)
				.addService(
					'releaseExecutor',
					({ queryHandler, dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, stageTree, db }) =>
						new ReleaseExecutor(
							queryHandler,
							dependencyBuilder,
							permissionVerifier,
							eventApplier,
							eventsRebaser,
							stageTree,
							db,
						),
				)
				.addService(
					'migrationDiffCreator',
					({ schemaDiffer, migrationFilesManager, schemaVersionBuilder }) =>
						new MigrationDiffCreator(migrationFilesManager, schemaVersionBuilder, schemaDiffer),
				)
				.addService(
					'projectMigrationInfoResolver',
					({ queryHandler, migrationsResolver }) =>
						new ProjectMigrationInfoResolver(this.project, migrationsResolver, queryHandler),
				)
				.addService(
					'projectMigrator',
					({ db, stageTree, migrationsResolver, schemaVersionBuilder, modificationHandlerFactory, providers }) =>
						new ProjectMigrator(
							db,
							stageTree,
							migrationsResolver,
							modificationHandlerFactory,
							schemaVersionBuilder,
							providers,
						),
				)
				.addService('stageCreator', ({ db, eventApplier, providers }) => new StageCreator(db, eventApplier, providers))
				.addService(
					'projectIntializer',
					({ db, stageTree, projectMigrator, rebaseExecutor, projectMigrationInfoResolver, stageCreator, providers }) =>
						new ProjectInitializer(
							db,
							this.project,
							stageTree,
							projectMigrator,
							rebaseExecutor,
							projectMigrationInfoResolver,
							stageCreator,
							providers,
						),
				)
				.addService(
					'migrationSqlDryRunner',
					({ schemaVersionBuilder, modificationHandlerFactory, migrationsResolver }) =>
						new MigrationSqlDryRunner(migrationsResolver, modificationHandlerFactory, schemaVersionBuilder),
				)
		}
	}
}

export { SystemExecutionContainer }

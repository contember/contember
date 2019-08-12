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
import Container from '../core/di/Container'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import { Client } from '@contember/database'
import SchemaVersionBuilder from '../content-schema/SchemaVersionBuilder'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import PermissionsVerifier from './model/events/PermissionsVerifier'
import DependencyBuilder from './model/events/DependencyBuilder'
import PermissionsByIdentityFactory from '../acl/PermissionsByIdentityFactory'
import DiffBuilder from './model/events/DiffBuilder'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import Project from '../config/Project'
import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import MigrationsResolver from '../content-schema/MigrationsResolver'
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
			private readonly project: Project,
			private readonly migrationsResolver: MigrationsResolver,
			private readonly migrationFilesManager: MigrationFilesManager,
			private readonly authorizator: Authorizator,
			private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
			private readonly modificationHandlerFactory: ModificationHandlerFactory,
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
			return new Container.Builder({})
				.addService('migrationFilesManager', ({}) => this.migrationFilesManager)
				.addService('migrationsResolver', () => this.migrationsResolver)
				.addService('modificationHandlerFactory', () => this.modificationHandlerFactory)
				.addService('authorizator', () => this.authorizator)
				.addService('permissionsByIdentityFactory', () => this.permissionsByIdentityFactory)

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
					({ schemaVersionBuilder, modificationHandlerFactory }) =>
						new MigrationExecutor(modificationHandlerFactory, schemaVersionBuilder),
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
					({ schemaVersionBuilder, db, authorizator, permissionsByIdentityFactory }) =>
						new PermissionsVerifier(this.project, schemaVersionBuilder, db, permissionsByIdentityFactory, authorizator),
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
					({ db, stageTree, migrationsResolver, schemaVersionBuilder, modificationHandlerFactory }) =>
						new ProjectMigrator(db, stageTree, migrationsResolver, modificationHandlerFactory, schemaVersionBuilder),
				)
				.addService('stageCreator', ({ db, eventApplier }) => new StageCreator(db, eventApplier))
				.addService(
					'projectIntializer',
					({ db, stageTree, projectMigrator, rebaseExecutor, projectMigrationInfoResolver, stageCreator }) =>
						new ProjectInitializer(
							db,
							this.project,
							stageTree,
							projectMigrator,
							rebaseExecutor,
							projectMigrationInfoResolver,
							stageCreator,
						),
				)
				.addService(
					'migrationSqlDryRunner',
					({ schemaVersionBuilder, modificationHandlerFactory, migrationsResolver }) =>
						new MigrationSqlDryRunner(
							this.project,
							migrationsResolver,
							modificationHandlerFactory,
							schemaVersionBuilder,
						),
				)
		}
	}
}

export default SystemExecutionContainer

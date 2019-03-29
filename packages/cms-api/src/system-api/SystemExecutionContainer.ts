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
import KnexWrapper from '../core/knex/KnexWrapper'
import SchemaVersionBuilder from '../content-schema/SchemaVersionBuilder'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import PermissionsVerifier from './model/events/PermissionsVerifier'
import DependencyBuilder from './model/events/DependencyBuilder'
import Authorizator from '../core/authorization/Authorizator'
import PermissionsByIdentityFactory from '../acl/PermissionsByIdentityFactory'
import DiffBuilder from './model/events/DiffBuilder'
import QueryHandler from '../core/query/QueryHandler'
import KnexQueryable from '../core/knex/KnexQueryable'
import Project from '../config/Project'
import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import MigrationsResolver from '../content-schema/MigrationsResolver'
import RebaseExecutor from './model/events/RebaseExecutor'
import StageTree from './model/stages/StageTree'

interface SystemExecutionContainer {
	releaseExecutor: ReleaseExecutor
	rebaseExecutor: RebaseExecutor
	diffBuilder: DiffBuilder
	queryHandler: QueryHandler<KnexQueryable>
}

namespace SystemExecutionContainer {
	export class Factory {
		constructor(
			private readonly project: Project,
			private readonly migrationsResolver: MigrationsResolver,
			private readonly migrationFilesManager: MigrationFilesManager,
			private readonly authorizator: Authorizator,
			private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
			private readonly schemaMigrator: SchemaMigrator,
			private readonly migrationExecutor: MigrationExecutor,
		) {
		}

		public create(db: KnexWrapper): SystemExecutionContainer {
			return new Container.Builder({})
				.addService('db', () => db)
				.addService('queryHandler', ({ db }) => db.createQueryHandler())
				.addService(
					'schemaVersionBuilder',
					({ queryHandler }) => new SchemaVersionBuilder(queryHandler, this.migrationsResolver, this.schemaMigrator)
				)
				.addService('migrationFilesManager', ({}) => this.migrationFilesManager)

				.addService('tableReferencingResolver', () => new TableReferencingResolver())
				.addService('authorizator', () => this.authorizator)
				.addService(
					'dependencyBuilder',
					({ schemaVersionBuilder, tableReferencingResolver }) =>
						new DependencyBuilder.DependencyBuilderList([
							new MigrationsDependencyBuilder(),
							new SameRowDependencyBuilder(),
							new TransactionDependencyBuilder(),
							new DeletedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
							new CreatedRowReferenceDependencyBuilder(schemaVersionBuilder, tableReferencingResolver),
						])
				)
				.addService(
					'permissionVerifier',
					({ schemaVersionBuilder, db, authorizator }) =>
						new PermissionsVerifier(this.project, schemaVersionBuilder, db, this.permissionsByIdentityFactory, authorizator)
				)
				.addService(
					'diffBuilder',
					({ dependencyBuilder, queryHandler, permissionVerifier }) =>
						new DiffBuilder(dependencyBuilder, queryHandler, permissionVerifier)
				)
				.addService(
					'eventApplier',
					({ db }) =>
						new EventApplier(db, this.migrationExecutor, this.migrationsResolver)
				)
				.addService('eventsRebaser', ({ db }) => new EventsRebaser(db))
				.addService(
					'releaseExecutor',
					({ queryHandler, dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, db}) =>
						new ReleaseExecutor(queryHandler, dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser, db)
				)
				.addService('stageTree', () =>
					new StageTree.Factory().create(this.project)
				)
				.addService('rebaseExecutor',
					({ queryHandler, dependencyBuilder, eventApplier, eventsRebaser, stageTree}) =>
						new RebaseExecutor(queryHandler, dependencyBuilder, eventApplier, eventsRebaser, stageTree)
				)
				.build()
				.pick('queryHandler', 'releaseExecutor', 'diffBuilder', 'rebaseExecutor')
		}
	}
}

export default SystemExecutionContainer

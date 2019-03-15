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
import Migration from './model/migrations/Migration'

interface SystemExecutionContainer {
	releaseExecutor: ReleaseExecutor
	diffBuilder: DiffBuilder
	queryHandler: QueryHandler<KnexQueryable>
}

namespace SystemExecutionContainer {
	export class Factory {
		constructor(
			private readonly project: Project,
			private readonly migrations: Promise<Migration[]>,
			private readonly migrationFilesManager: MigrationFilesManager,
			private readonly authorizator: Authorizator,
			private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
			private readonly schemaMigrator: SchemaMigrator,
			private readonly migrationExecutor: MigrationExecutor,
		) {}

		public create(db: KnexWrapper): SystemExecutionContainer {
			return new Container.Builder({})
				.addService('db', () => db)
				.addService('queryHandler', ({ db }) => db.createQueryHandler())
				.addService(
					'schemaVersionBuilder',
					({ queryHandler }) => new SchemaVersionBuilder(queryHandler, this.migrations, this.schemaMigrator)
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
					({ db, migrationFilesManager }) =>
						new EventApplier(db, this.migrationExecutor, migrationFilesManager)
				)
				.addService('eventsRebaser', ({ db }) => new EventsRebaser(db))
				.addService(
					'releaseExecutor',
					({ queryHandler, dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser }) =>
						new ReleaseExecutor(queryHandler, dependencyBuilder, permissionVerifier, eventApplier, eventsRebaser)
				)
				.build()
				.pick('queryHandler', 'releaseExecutor', 'diffBuilder')
		}
	}
}

export default SystemExecutionContainer

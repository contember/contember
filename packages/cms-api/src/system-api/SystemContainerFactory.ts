import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import SystemApolloServerFactory from '../http/SystemApolloServerFactory'
import Container from '../core/di/Container'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import ResolverFactory from './resolvers/ResolverFactory'
import PermissionsFactory from '../tenant-api/model/authorization/PermissionsFactory'
import Authorizator from '../core/authorization/Authorizator'
import AccessEvaluator from '../core/authorization/AccessEvalutator'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import PermissionsByIdentityFactory from '../acl/PermissionsByIdentityFactory'
import SystemExecutionContainer from './SystemExecutionContainer'
import MigrationsResolver from '../content-schema/MigrationsResolver'
import Project from '../config/Project'
import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import SchemaDiffer from './model/migrations/SchemaDiffer'
import ModificationHandlerFactory from './model/migrations/modifications/ModificationHandlerFactory'
import KnexWrapper from '../core/knex/KnexWrapper'
import RebeaseAllMutationResolver from './resolvers/mutation/RebeaseAllMutationResolver'
import { Resolvers } from './schema/types'

export interface SystemContainer {
	systemApolloServerFactory: SystemApolloServerFactory
	systemResolvers: Resolvers
	authorizator: Authorizator
	systemExecutionContainerFactory: SystemExecutionContainer.Factory,
}

export default class SystemContainerFactory {
	public create(container: {
		project: Project,
		migrationFilesManager: MigrationFilesManager
		permissionsByIdentityFactory: PermissionsByIdentityFactory
		migrationsResolver: MigrationsResolver,
		schemaMigrator: SchemaMigrator,
		modificationHandlerFactory: ModificationHandlerFactory,
		systemKnexWrapper: KnexWrapper,
	}): Container<SystemContainer> {
		return new Container.Builder({})

			.addService('systemStagesQueryResolver', () => new StagesQueryResolver())
			.addService('tableReferencingResolver', () => new TableReferencingResolver())
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator => new Authorizator.Default(accessEvaluator))

			.addService('systemDiffResponseBuilder', () => new DiffResponseBuilder())
			.addService(
				'systemDiffQueryResolver',
				({ systemDiffResponseBuilder }) => new DiffQueryResolver(systemDiffResponseBuilder)
			)
			.addService('releaseMutationResolver', () => new ReleaseMutationResolver())
			.addService('rebaseMutationResolver', () => new RebeaseAllMutationResolver())
			.addService(
				'systemResolvers',
				({ systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver, rebaseMutationResolver }) =>
					new ResolverFactory(systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver, rebaseMutationResolver).create()
			)
			.addService(
				'systemExecutionContainerFactory',
				({ authorizator }) =>
					new SystemExecutionContainer.Factory(
						container.project,
						container.migrationsResolver,
						container.migrationFilesManager,
						authorizator,
						container.permissionsByIdentityFactory,
						container.modificationHandlerFactory
					)
			)
			.addService(
				'systemApolloServerFactory',
				({ systemResolvers, authorizator, systemExecutionContainerFactory }) =>
					new SystemApolloServerFactory(systemResolvers, authorizator, systemExecutionContainerFactory)
			)

			.build()
			.pick('systemApolloServerFactory',
				'systemResolvers', 'authorizator', 'systemExecutionContainerFactory')
	}
}

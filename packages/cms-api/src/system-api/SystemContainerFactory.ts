import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import SystemApolloServerFactory from '../http/SystemApolloServerFactory'
import Container from '../core/di/Container'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import ResolverFactory from './resolvers/ResolverFactory'
import { IResolvers } from 'graphql-tools'
import PermissionsFactory from '../tenant-api/model/authorization/PermissionsFactory'
import Authorizator from '../core/authorization/Authorizator'
import AccessEvaluator from '../core/authorization/AccessEvalutator'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import PermissionsByIdentityFactory from '../acl/PermissionsByIdentityFactory'
import { Acl } from 'cms-common'
import SystemExecutionContainer from './SystemExecutionContainer'
import SchemaMigrationDiffsResolver from '../content-schema/SchemaMigrationDiffsResolver'
import Project from '../config/Project'

export default class SystemContainerFactory {
	public create(container: {
		project: Project,
		migrationFilesManager: MigrationFilesManager
		permissionsByIdentityFactory: PermissionsByIdentityFactory
		schemaMigrationDiffsResolver: SchemaMigrationDiffsResolver
	}): Container<{
		systemApolloServerFactory: SystemApolloServerFactory
		systemResolvers: IResolvers
		authorizator: Authorizator
		executionContainerFactory: SystemExecutionContainer.Factory
	}> {
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
			.addService(
				'systemResolvers',
				({ systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver }) =>
					new ResolverFactory(systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver).create()
			)
			.addService(
				'executionContainerFactory',
				({ authorizator }) =>
					new SystemExecutionContainer.Factory(
						container.project,
						container.schemaMigrationDiffsResolver.resolve(),
						container.migrationFilesManager,
						authorizator,
						container.permissionsByIdentityFactory
					)
			)
			.addService(
				'systemApolloServerFactory',
				({ systemResolvers, authorizator, executionContainerFactory }) =>
					new SystemApolloServerFactory(systemResolvers, authorizator, executionContainerFactory)
			)
			.build()
			.pick('systemApolloServerFactory', 'systemResolvers', 'authorizator', 'executionContainerFactory')
	}
}
